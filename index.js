/* eslint-disable indent */
const {
  Client,
  Events,
  GatewayIntentBits,
  Message,
  Collection,
} = require("discord.js");
const fs = require("fs");
const npFile = require("./commands/np.js");
const { token, statsConfig } = require("./resources/config.json");
const responses = require("./resources/responses.json");
const chanceResponses = require("./resources/chanceResponses.json");
const stats = require("./resources/stats.json");
const ranks = require("./resources/ranks.json");
const fetch = require("node-fetch");
const path = require("node:path");
globalThis.fetch = fetch;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
  allowedMentions: { parse: ["users", "roles"], repliedUser: true },
});
var date = new Date().toLocaleDateString("en-GB").slice(0, -5);
var splash;
var botUptime = 0;

const superReply = Message.prototype.reply;
Message.prototype.reply = async function (s) {
  try {
    return await superReply.call(this, { content: s, failIfNotExists: false });
  } catch (e) {
    console.log(e.message);
  }
};

const superDelete = Message.prototype.delete;
Message.prototype.delete = async function () {
  try {
    return await superDelete.call(this);
  } catch (e) {
    console.log(e.message);
  }
};

client.commands = new Collection();
const commandsPath = path.join("./commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require("./" + filePath);

  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

async function checkBirthdays(force = false) {
  try {
    const birthdays = require("./tasks/birthdays.js");
    date = await birthdays.run(client, date, force);
  } catch (e) {
    return console.error(e);
  }
}

async function checkMinecraftServer() {
  try {
    const minecraftServer = require("./tasks/minecraft.js");
    await minecraftServer.run(client, splash);
  } catch (e) {
    return console.error(e);
  }
}

async function getNewSplash() {
  splash = await npFile.run([client]);
}

function getNickname(msg) {
  return msg.guild.members.cache.filter((m) => m.id == msg.author.id).first()
    .displayName;
}

async function saveStats() {
  try {
    const saveStats = require("./tasks/savestats.js");
    await saveStats.run(stats);
  } catch (e) {
    return console.error(e);
  }
}

async function backupStats() {
  try {
    const backupStats = require("./tasks/backupstats.js");
    await backupStats.run(stats);
  } catch (e) {
    return console.error(e);
  }
}

async function addDecayToStats() {
  // This function should really be a separate task!!!
  Object.entries(stats).forEach(([guild, gv]) => {
    if (stats[guild]["allowDecay"] ?? true) {
      Object.keys(gv)
        .filter((k) => k.length == 18)
        .forEach((member) => {
          if (
            stats[guild][member]["score"] >
              statsConfig["decaySRLossThreshold"] &&
            Math.floor(Date.now() / 1000) -
              Math.max(
                stats[guild][member]["joinTime"],
                stats[guild][member]["lastGainTime"]
              ) >
              getTime(0, 0, 24) / 1000
          ) {
            stats[guild][member]["lastGainTime"] = Math.floor(
              Date.now() / 1000
            );
            stats[guild][member]["decay"] += statsConfig["decaySRLoss"];
          }
        });
    }
  });
}

async function checkVoiceChannels() {
  // This function should ALSO really be a separate task!!!
  const guilds = client.guilds.cache;
  guilds.forEach(async (guild) => {
    const channels = guild.channels.cache.filter(
      (channel) => channel.type == 2 // voice channel
    );
    channels.forEach(async (channel) => {
      channel.members.forEach(async (member) => {
        await addToStats({
          type: "inVoiceChannel",
          userId: member.user.id,
          guildId: member.guild.id,
        });
      });
    });
  });
}

function getTime(seconds = 0, minutes = 0, hours = 0) {
  return 1000 * seconds + 1000 * 60 * minutes + 1000 * 60 * 60 * hours;
}

async function checkMessageResponse(msg) {
  // swap Twitter/X URLs for proper embedding ones
  if (
    ["https://x.com/", "https://twitter.com/"].find((l) =>
      msg.content.includes(l)
    )
  ) {
    msg.channel.send(
      `${getNickname(msg)} sent:\n${msg.content
        .replace("https://x.com/", "https://fixupx.com/")
        .replace("https://twitter.com/", "https://fxtwitter.com/")}`
    );

    msg.delete();
    return;
  }

  // swap steamcommunity links for openable ones
  if (msg.content.includes("https://steamcommunity.com")) {
    const steamLink = msg.content
      .split(" ")
      .find((m) => m.includes("https://steamcommunity.com"));
    msg.channel.send(
      `Embedded link: https://yakasov.github.io/pages/miscellaneous/steam_direct.html?page=${steamLink}`
    );
  }

  async function f(k, v) {
    if (v.includes("{AUTHOR}")) {
      v = v.replace("{AUTHOR}", getNickname(msg));
    }

    if (v.includes("{FOLLOWING}")) {
      var lastMsg;
      if (msg.content.trim() === k) {
        lastMsg = await msg.channel.messages
          .fetch({ limit: 2 })
          .then((c) => getNickname([...c.values()].pop()));
      }

      const following = msg.content.toLowerCase().split(k).slice(1).join(k);
      v = v.replace(
        "{FOLLOWING}",
        lastMsg || !following.trim()
          ? lastMsg ?? getNickname(msg)
          : following.trim()
      );
    }

    if (v.includes("{STICKER:")) {
      const stickerId = v.split(":")[1].slice(0, -1);
      const sticker = msg.guild.stickers.cache.filter(
        (s) => s.id === stickerId
      );
      if (sticker.size) {
        return msg.channel.send({
          stickers: sticker,
        });
      }
      return;
    }

    return msg.channel.send(v);
  }

  const entries = Object.entries(responses);
  for (let i = 0; i < entries.length; i++) {
    const [k, v] = entries[i];
    if (` ${msg.content.toLowerCase()} `.includes(` ${k} `)) {
      return await f(k, v);
    }
  }
}

async function checkMessageReactions(msg) {
  Object.values(chanceResponses).some((v) => {
    const roll = Math.random();

    if (roll < v["chance"] / 100) {
      switch (v["type"]) {
        case "message":
          msg.reply(v["string"]);
          break;

        case "react":
          msg.react(v["string"]);
          break;

        case "react_custom":
          if (v["user"] === msg.author.id && Math.random() < 0.25) {
            const reaction = msg.guild.emojis.cache.find(
              (e) => e.name === v["string"]
            );

            if (reaction) {
              msg.react(reaction);
            }
          }
          break;

        default:
          break;
      }

      return true;
    }

    return false;
  });
}

async function initialiseStats(guildId, userId) {
  const baseObj = {
    messages: 0,
    voiceTime: 0,
    joinTime: 0,
    lastGainTime: 0,
    decay: 0,
    nerdEmojis: {},
    nerdsGiven: 0,
    nerdHandicap: 0,
    nerdScore: 0,
    score: 0,
    realScore: 0,
    reputation: 0,
    reputationTime: 0,
    bestScore: 0,
    bestRanking: "",
    prestige: 0,
    previousMessages: 0,
    previousVoiceTime: 0,
  };

  if (!stats[guildId][userId]) return (stats[guildId][userId] = baseObj);

  Object.entries(baseObj).forEach(([k, v]) => {
    if (!stats[guildId][userId][k]) {
      stats[guildId][userId][k] = v;
    }
  });

  Object.keys(stats[guildId][userId]).forEach((k) => {
    if (baseObj[k] === undefined) {
      delete stats[guildId][userId][k];
    }
  });
}

async function addToStats(a) {
  function f() {
    // Returns UNIX time in seconds.
    return Math.floor(Date.now() / 1000);
  }

  const { type, userId, guildId, messageId, giver } = a;
  const giverId = giver ? giver.id : 0;

  if (!stats[guildId])
    stats[guildId] = {
      allowDecay: true,
      rankUpChannel: "",
    };

  await initialiseStats(guildId, userId);
  await initialiseStats(guildId, giverId);

  switch (type) {
    case "init":
      // used for setting up initial stat values
      return;

    case "message":
      if (
        f() - stats[guildId][userId]["lastGainTime"] <
        statsConfig["messageSRGainCooldown"]
      )
        return;
      stats[guildId][userId]["lastGainTime"] = f();
      stats[guildId][userId]["messages"] += 1;
      break;

    case "joinedVoiceChannel":
      stats[guildId][userId]["joinTime"] = f();
      break;

    case "inVoiceChannel":
      if (botUptime < 10) {
        stats[guildId][userId]["joinTime"] = f();
      }
      stats[guildId][userId]["voiceTime"] =
        stats[guildId][userId]["voiceTime"] +
        Math.floor(
          f() -
            (stats[guildId][userId]["joinTime"] == 0
              ? f()
              : stats[guildId][userId]["joinTime"])
        );
      stats[guildId][userId]["joinTime"] = f();
      break;

    case "leftVoiceChannel":
      stats[guildId][userId]["voiceTime"] =
        (stats[guildId][userId]["voiceTime"] ?? 0) +
        Math.floor(f() - stats[guildId][userId]["joinTime"]);
      break;

    case "nerdEmojiAdded":
      if (!messageId) return;
      if (!giver.bot) {
        stats[guildId][giverId]["nerdsGiven"] =
          (stats[guildId][giverId]["nerdsGiven"] ?? 0) + 1;
      }

      stats[guildId][userId]["nerdEmojis"][messageId] =
        (stats[guildId][userId]["nerdEmojis"][messageId] ?? 0) +
        1 +
        (Math.floor(stats[guildId][giverId]["prestige"] / 2) ?? 0);
      break;

    case "nerdEmojiRemoved":
      if (!messageId) return;
      if (!giver.bot) {
        stats[guildId][giverId]["nerdsGiven"] = Math.max(
          0,
          (stats[guildId][giverId]["nerdsGiven"] ?? 0) - 1
        );
      }

      stats[guildId][userId]["nerdEmojis"][messageId] = Math.max(
        0,
        (stats[guildId][userId]["nerdEmojis"][messageId] ?? 0) -
          (1 + (Math.floor(stats[guildId][giverId]["prestige"] / 2) ?? 0))
      );
      break;

    default:
      break;
  }

  await updateScores();
  await saveStats();
}

async function updateScores() {
  Object.entries(stats).forEach(async ([guild, guildStats]) => {
    Object.keys(guildStats)
      .filter((k) => k.length == 18)
      .forEach(async (user) => {
        await addToStats({ type: "init", userId: user, guildId: guild });
        const nerdPower = (stats[guild][user]["prestige"] ?? 0) > 0 ? 2.8 : 1.8;
        stats[guild][user]["nerdScore"] =
          Object.values(stats[guild][user]["nerdEmojis"]).reduce(
            (sum, a) => sum + Math.max(nerdPower ** a + 1, 0) - 1,
            0
          ) - (stats[guild][user]["nerdHandicap"] ?? 0);

        const realScore = Math.floor(
          (stats[guild][user]["voiceTime"] * statsConfig["voiceChatSRGain"] +
            stats[guild][user]["messages"] * statsConfig["messageSRGain"]) *
            Math.max(
              1 +
                (stats[guild][user]["reputation"] ?? 0) *
                  statsConfig["reputationGain"],
              0.01
            ) *
            1.2 ** (stats[guild][user]["prestige"] ?? 0) -
            stats[guild][user]["nerdScore"] -
            stats[guild][user]["decay"]
        );
        const score = Math.max(0, realScore);

        stats[guild][user]["realScore"] = realScore;
        if (
          stats[guild][user]["score"] > statsConfig["prestigeRequirement"] &&
          stats[guild][user]["prestige"] < statsConfig["prestigeMaximum"]
        ) {
          stats[guild][user]["score"] = statsConfig["prestigeRequirement"];
        } else {
          stats[guild][user]["score"] = score;
        }

        if (
          stats[guild][user]["score"] >
            (stats[guild][user]["bestScore"] ?? 0) ||
          stats[guild][user]["bestScore"] == 50000 // Fix for bestScore being stuck at 50K after prestige
        ) {
          stats[guild][user]["bestScore"] = stats[guild][user]["score"];

          if (
            stats[guild][user]["bestRanking"] !=
              (await getRanking(stats[guild][user]["realScore"])) &&
            stats[guild]["rankUpChannel"] &&
            botUptime > 120
          ) {
            const guildObject = await client.guilds.fetch(guild);
            const userObject = guildObject.members.cache
              .filter((m) => m.id == user)
              .first();
            const channel = await guildObject.channels.fetch(
              stats[guild]["rankUpChannel"]
            );
            channel.send(
              "## Rank Up!\n```ansi\n" +
                userObject.displayName +
                " has reached rank " +
                (await getRanking(stats[guild][user]["realScore"])) +
                "!```"
            );
          }
          stats[guild][user]["bestRanking"] = await getRanking(
            stats[guild][user]["realScore"]
          );
        }
      });
  });
}

async function getRanking(score) {
  var rankString = "MISSINGNO";
  Object.entries(ranks).forEach(([k, v]) => {
    if (v[0] <= score) {
      rankString = `${v[1]}${k}\u001b[0m`;
    }
  });
  return rankString;
}

client.once(Events.ClientReady, async (c) => {
  console.log(
    "Connected and ready to go!\n" +
      `Current date is ${date}, ` +
      `logged in as ${c.user.tag}\n`
  );

  await checkVoiceChannels();
  await checkBirthdays(true);
  await checkMinecraftServer();
  await getNewSplash();
  await addDecayToStats();
  await backupStats();

  setInterval(() => {
    botUptime += 10;
  }, getTime(10));
  setInterval(checkBirthdays, getTime(0, 15)); // 15 minutes
  setInterval(checkMinecraftServer, getTime(5)); // 5 seconds
  setInterval(getNewSplash, getTime(0, 0, 1)); // 1 hour
  setInterval(addDecayToStats, getTime(0, 0, 1)); // 1 hour
  setInterval(checkVoiceChannels, getTime(15)); // 15 seconds
  setInterval(backupStats, getTime(0, 15)); // 15 minutes
});

client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot || !msg.guild) return;
  if (msg.author.id == "269143269336809483") {
    console.log(`${getNickname(msg)} in ${msg.guild}: ${msg.content}`);
  }

  await checkMessageResponse(msg);
  await checkMessageReactions(msg);

  return await addToStats({
    type: "message",
    userId: msg.author.id,
    guildId: msg.guild.id,
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

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
});

client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
  if (newState.member.bot) return;

  if (oldState.channel && !newState.channel) {
    await addToStats({
      type: "leftVoiceChannel",
      userId: newState.member.id,
      guildId: newState.guild.id,
    });
  } else if (!oldState.channel && newState.channel) {
    await addToStats({
      type: "joinedVoiceChannel",
      userId: newState.member.id,
      guildId: newState.guild.id,
    });
  }
});

client.on(Events.MessageReactionAdd, async (reaction, user) => {
  if (reaction.emoji.name == "🤓") {
    await addToStats({
      type: "nerdEmojiAdded",
      userId: reaction.message.author.id,
      guildId: reaction.message.guildId,
      messageId: reaction.message.id,
      giver: user,
    });
  }
});

client.on(Events.MessageReactionRemove, async (reaction, user) => {
  if (reaction.emoji.name == "🤓") {
    await addToStats({
      type: "nerdEmojiRemoved",
      userId: reaction.message.author.id,
      guildId: reaction.message.guildId,
      messageId: reaction.message.id,
      giver: user,
    });
  }
});

client.login(token);
