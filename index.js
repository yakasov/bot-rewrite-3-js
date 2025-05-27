"use strict";

const process = require("node:process");
process.on("unhandledRejection", (error) => {
  console.error("Unhandled error:", error);
});

const { initialSetup } = require("./util/setup.js");
initialSetup();

const {
  Client,
  Events,
  GatewayIntentBits,
  Message,
  Collection,
  EmbedBuilder,
} = require("discord.js");
const moment = require("moment-timezone");
const fs = require("fs");
const { Cards } = require("scryfall-api");
const npFile = require("./commands/np.js");
const { token, botResponseChance } = require("./resources/config.json");
const responses = require("./resources/responses.json");
const chanceResponses = require("./resources/chanceResponses.json");
const loadedStats = require("./resources/stats.json");
const checkAchievements = require("./util/achievements.js");
const { getNicknameMsg } = require("./util/common.js");
const {
  addToStats,
  backupStats,
  checkVoiceChannels,
  saveStats,
  updateScores,
} = require("./util/stats.js");
const { generateRollTable } = require("./util/rollTableGenerator.js");
const fetch = require("node-fetch");
const path = require("node:path");
globalThis.fetch = fetch;
globalThis.stats = loadedStats;
globalThis.rollTable = generateRollTable(chanceResponses);
globalThis.currentDate = moment()
  .tz("Europe/London");
globalThis.firstRun = { birthdays: true, minecraft: 1 };
globalThis.botUptime = 0;
globalThis.client = new Client({
  allowedMentions: {
    parse: ["users", "roles"],
    repliedUser: true,
  },
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
});
let splash = "";

const superReply = Message.prototype.reply;
Message.prototype.reply = function (s) {
  try {
    return superReply.call(this, {
      content: s,
      failIfNotExists: false,
    });
  } catch (e) {
    return console.error(e.message);
  }
};

const superDelete = Message.prototype.delete;
Message.prototype.delete = function () {
  try {
    return superDelete.call(this);
  } catch (e) {
    return console.error(e.message);
  }
};

globalThis.client.commands = new Collection();
const commandsPath = path.join("./commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(`./${filePath}`);

  if ("data" in command && "execute" in command) {
    globalThis.client.commands.set(command.data.name, command);
  } else {
    console.warn(
      `[WARNING] The command at ${filePath} is 
      missing a required "data" or "execute" property.`
    );
  }
}

function getTime(seconds = 0, minutes = 0, hours = 0) {
  return 1000 * seconds + 1000 * 60 * minutes + 1000 * 60 * 60 * hours;
}

function checkBirthdays(force = false) {
  require("./tasks/birthdays.js")
    .run(globalThis.client, force);
}

function checkFortniteShop() {
  require("./tasks/fortnite.js")
    .run(globalThis.client);
}

async function checkMinecraftServer() {
  await require("./tasks/minecraft.js")
    .run(globalThis.client, splash);
}

function getNewSplash() {
  splash = npFile.run([globalThis.client]);
}

async function checkMessageResponse(msg) {
  // Swap Twitter/X URLs for proper embedding ones
  if (
    ["https://x.com/", "https://twitter.com/"].find((l) =>
      msg.content.includes(l)) &&
    msg.content.includes("status")
  ) {
    const content = `${getNicknameMsg(msg)} sent:\n${msg.content
      .replace("https://x.com/", "https://fixupx.com/")
      .replace("https://twitter.com/", "https://fxtwitter.com/")}`;

    if (msg.reference && msg.reference.channelId === msg.channel.id) {
      const replyMsg = await msg.channel.messages.fetch(msg.reference.messageId);
      replyMsg.reply(content);
    } else {
      msg.channel.send(content);
    }

    await msg.delete()
      .catch(console.error);
    return;
  }

  const steamLinkRegex = /https:\/\/steamcommunity\.com\S*/gu;
  // Swap steamcommunity links for openable ones
  if (steamLinkRegex.test(msg.content)) {
    const steamLink =
      msg.content.split(" ")
        .find((m) => steamLinkRegex.test(m)) ?? msg.content;
    msg.channel.send(
      /* eslint-disable-next-line max-len */
      `Embedded link: https://yakasov.github.io/pages/miscellaneous/steam_direct.html?page=${encodeURIComponent(steamLink)}`
    );
  }

  async function f(k, v) {
    let res = v;
    if (res.includes("{AUTHOR}")) {
      res = res.replace("{AUTHOR}", getNicknameMsg(msg));
    }

    if (res.includes("{FOLLOWING}")) {
      let lastMsg = "";
      if (
        msg.content.toLowerCase()
          .trim() === k ||
        msg.content.toLowerCase()
          .trim()
          .endsWith(k)
      ) {
        lastMsg = await msg.channel.messages
          .fetch({
            limit: 2,
          })
          .then((c) => getNicknameMsg([...c.values()].pop()));
      }

      const following = msg.content.toLowerCase()
        .split(k)
        .slice(1)
        .join(k);
      res = res.replace(
        "{FOLLOWING}",
        lastMsg || !following.trim()
          ? lastMsg ?? getNicknameMsg(msg)
          : following.trim()
      );
    }

    if (res.includes("{STICKER:")) {
      const stickerId = res.split(":")[1].slice(0, -1);
      const sticker = msg.guild.stickers.cache.filter(
        (s) => s.id === stickerId
      );
      if (sticker.size) {
        return msg.channel.send({
          stickers: sticker,
        });
      }
      return null;
    }

    return msg.channel.send(res);
  }

  const entries = Object.entries(responses);
  for (let i = 0; i < entries.length; i++) {
    const [k, v] = entries[i];
    if (` ${msg.content.toLowerCase()} `.includes(` ${k} `)) {
      /* eslint-disable-next-line consistent-return */
      return f(k, v);
    }
  }
}

async function checkMessageReactions(msg) {
  // Fix for deleted message - return if message fetch fails
  try {
    await msg.channel.messages.fetch(msg.id);
  } catch {
    return;
  }

  const roll = Math.random() * 100;
  const initialRoll = Math.random() * 100;

  if (initialRoll < (botResponseChance ?? 0)) {
    Object.values(globalThis.rollTable)
      .some((response) => {
        if (roll < response.chance) {
          try {
            switch (response.type) {
            case "message":
              msg.reply(response.string);
              break;

            case "react":
              msg.react(response.string);
              break;

            default:
              break;
            }

            return true;
          } catch (e) {
            console.error(e);
            return false;
          }
        }

        return false;
      });
  }
}

function handleClientReady(c) {
  console.log(
    "Connected and ready to go!\n" +
      `Current date is ${globalThis.currentDate}, ` +
      `logged in as ${c.user.tag}\n`
  );

  checkVoiceChannels();
  checkBirthdays(true);
  checkMinecraftServer();
  getNewSplash();
  backupStats();

  /* eslint-disable line-comment-position */
  setInterval(() => {
    globalThis.botUptime += 10;
  }, getTime(10));
  setInterval(checkBirthdays, getTime(0, 15)); // 15 minutes
  setInterval(checkFortniteShop, getTime(0, 15)); // 15 minutes
  setInterval(checkMinecraftServer, getTime(5)); // 5 seconds
  setInterval(getNewSplash, getTime(0, 0, 1)); // 1 hour
  setInterval(checkVoiceChannels, getTime(15)); // 15 seconds
  setInterval(saveStats, getTime(0, 3)); // 3 minutes
  setInterval(backupStats, getTime(0, 15)); // 15 minutes
  setInterval(updateScores, getTime(30)); // 30 seconds
  /* eslint-enable line-comment-position */
}

async function handleMessageCreate(msg) {
  // Check if Scryfall has given a stupid response
  if (
    msg.author.id === "268547439714238465" &&
    msg?.embeds[0]?.data?.description?.includes("Multiple cards match")
  ) {
    const cardName = msg.embeds[0].data.description.match(
      /(?<=Multiple cards match “)(?:.*)(?=”, can you be more specific?)/gu
    )[0];

    if (cardName.length > 1) {
      const results = await Cards.autoCompleteName(cardName);

      /*
       * Sometimes this happens with names like 'miku'
       * I think the Scryfall bot works for all languages
       * whereas AutoCompleteName only works for one at a time
       */
      if (!results.length) {
        return;
      }

      let embedString = "";
      results.forEach((c, i) => {
        embedString += `${i + 1}. ${c}\n`;
      });

      const embed = new EmbedBuilder()
        .setTitle("Scryfall Cards")
        .addFields({
          name: `Returned ${results.length} cards:`,
          value: embedString,
        });

      msg.channel.send({ embeds: [embed] });
      return;
    }
  }

  if (msg.author.bot || !msg.guild) {
    return;
  }

  await checkMessageResponse(msg);
  if (
    globalThis.stats[msg.guild.id] &&
    (globalThis.stats[msg.guild.id].allowResponses ?? true)
  ) {
    await checkMessageReactions(msg);
  }

  addToStats({
    guildId: msg.guild.id,
    type: "message",
    userId: msg.author.id,
  });

  checkAchievements.run(msg);
}

async function handleInteractionCreate(interaction) {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    } else {
      await interaction.reply({
        content: "There was an error while executing this command!",
        ephemeral: true,
      });
    }
  }
}

function handleVoiceStateUpdate(oldState, newState) {
  if (newState.member.bot) {
    return;
  }

  if (oldState.channel && !newState.channel) {
    addToStats({
      guildId: newState.guild.id,
      type: "leftVoiceChannel",
      userId: newState.member.id,
    });
  } else if (!oldState.channel && newState.channel) {
    addToStats({
      guildId: newState.guild.id,
      type: "joinedVoiceChannel",
      userId: newState.member.id,
    });
  }
}

globalThis.client.once(Events.ClientReady, handleClientReady);
globalThis.client.on(Events.MessageCreate, handleMessageCreate);
globalThis.client.on(Events.InteractionCreate, handleInteractionCreate);
globalThis.client.on(Events.VoiceStateUpdate, handleVoiceStateUpdate);

globalThis.client.login(token);
