"use strict";

const {
  Client,
  Events,
  GatewayIntentBits,
  Message,
  Collection
} = require("discord.js");
const moment = require("moment-timezone");
const fs = require("fs");
const npFile = require("./commands/np.js");
const {
  token,
  statsConfig
} = require("./resources/config.json");
const responses = require("./resources/responses.json");
const chanceResponses = require("./resources/chanceResponses.json");
const loadedStats = require("./resources/stats.json");
const ranks = require("./resources/ranks.json");
const fetch = require("node-fetch");
const path = require("node:path");
globalThis.fetch = fetch;
globalThis.stats = loadedStats;

const client = new Client({
  "allowedMentions": {
    "parse": [
      "users",
      "roles"
    ],
    "repliedUser": true
  },
  "intents": [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildPresences,
    GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent
  ]
});
let date = moment()
  .tz("Europe/London")
  .format("DD/MM");
let splash = "";
let botUptime = 0;

const superReply = Message.prototype.reply;
Message.prototype.reply = function (s) {
  try {
    return superReply.call(this, {
      "content": s,
      "failIfNotExists": false
    });
  } catch (e) {
    return console.log(e.message);
  }
};

const superDelete = Message.prototype.delete;
Message.prototype.delete = function () {
  try {
    return superDelete.call(this);
  } catch (e) {
    return console.log(e.message);
  }
};

client.commands = new Collection();
const commandsPath = path.join("./commands");
const commandFiles = fs
  .readdirSync(commandsPath)
  .filter((file) => file.endsWith(".js"));
for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(`./${filePath}`);

  if ("data" in command && "execute" in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(
      `[WARNING] The command at ${filePath} is 
      missing a required "data" or "execute" property.`
    );
  }
}

function getTime(seconds = 0, minutes = 0, hours = 0) {
  return 1000 * seconds + 1000 * 60 * minutes + 1000 * 60 * 60 * hours;
}

function checkBirthdays(force = false) {
  try {
    const task = require("./tasks/birthdays.js");
    date = task.run(client, date, force);
    return null;
  } catch (e) {
    return console.error(e);
  }
}

function checkMinecraftServer() {
  try {
    const minecraftServer = require("./tasks/minecraft.js");
    return minecraftServer.run(client, splash);
  } catch (e) {
    return console.error(e);
  }
}

function getNewSplash() {
  splash = npFile.run([client]);
}

function getNickname(msg) {
  return msg.guild.members.cache.filter((m) => m.id === msg.author.id)
    .first()
    .displayName;
}

function saveStats() {
  try {
    const task = require("./tasks/saveStats.js");
    return task.run();
  } catch (e) {
    return console.error(e);
  }
}

function backupStats() {
  try {
    const task = require("./tasks/backupstats.js");
    return task.run();
  } catch (e) {
    return console.error(e);
  }
}

function addTokens() {
  try {
    const task = require("./tasks/addTokens.js");
    return task.run(globalThis.stats);
  } catch (e) {
    return console.error(e);
  }
}

function addDecayToStats() {
  // This function should really be a separate task!!!
  Object.entries(globalThis.stats)
    .forEach(([
      guild,
      gv
    ]) => {
      if (globalThis.stats[guild].allowDecay ?? true) {
        Object.keys(gv)
          .filter((k) => k.length === 18)
          .forEach((member) => {
            if (
              globalThis.stats[guild][member].score >
              statsConfig.decaySRLossThreshold &&
              Math.floor(Date.now() / 1000) -
              Math.max(
                globalThis.stats[guild][member].joinTime,
                globalThis.stats[guild][member].lastGainTime
              ) >
              getTime(0, 0, 24) / 1000
            ) {
              globalThis.stats[guild][member].lastGainTime = Math.floor(
                Date.now() / 1000
              );
              globalThis.stats[guild][member].decay += statsConfig.decaySRLoss;
            }
          });
      }
    });
}

function checkVoiceChannels() {
  // This function should ALSO really be a separate task!!!
  const guilds = client.guilds.cache;
  guilds.forEach((guild) => {
    const channels = guild.channels.cache.filter(
      // Voice channel is type 2
      (channel) => channel.type === 2
    );
    channels.forEach((channel) => {
      channel.members.forEach((member) => {
        addToStats({
          "guildId": member.guild.id,
          "type": "inVoiceChannel",
          "userId": member.user.id
        });
      });
    });
  });
}

function checkMessageResponse(msg) {
  // Swap Twitter/X URLs for proper embedding ones
  if (
    [
      "https://x.com/",
      "https://twitter.com/"
    ].find((l) =>
      msg.content.includes(l))
  ) {
    msg.channel.send(
      `${getNickname(msg)} sent:\n${msg.content
        .replace("https://x.com/", "https://fixupx.com/")
        .replace("https://twitter.com/", "https://fxtwitter.com/")}`
    );

    msg.delete()
      .catch(console.error);
    return;
  }

  // Swap steamcommunity links for openable ones
  if (msg.content.includes("https://steamcommunity.com")) {
    const steamLink = msg.content
      .split(" ")
      .find((m) => m.includes("https://steamcommunity.com"));
    msg.channel.send(
      /* eslint-disable-next-line max-len */
      `Embedded link: https://yakasov.github.io/pages/miscellaneous/steam_direct.html?page=${steamLink}`
    );
  }

  async function f(k, v) {
    let res = v;
    if (res.includes("{AUTHOR}")) {
      res = res.replace("{AUTHOR}", getNickname(msg));
    }

    if (res.includes("{FOLLOWING}")) {
      let lastMsg = "";
      if (msg.content.trim() === k) {
        lastMsg = await msg.channel.messages
          .fetch({
            "limit": 2
          })
          .then((c) => getNickname([...c.values()].pop()));
      }

      const following = msg.content.toLowerCase()
        .split(k)
        .slice(1)
        .join(k);
      res = res.replace(
        "{FOLLOWING}",
        lastMsg || !following.trim()
          ? lastMsg ?? getNickname(msg)
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
          "stickers": sticker
        });
      }
      return null;
    }

    return msg.channel.send(res);
  }

  const entries = Object.entries(responses);
  for (let i = 0; i < entries.length; i++) {
    const [
      k,
      v
    ] = entries[i];
    if (` ${msg.content.toLowerCase()} `.includes(` ${k} `)) {
      /* eslint-disable-next-line consistent-return */
      return f(k, v);
    }
  }
}

function checkMessageReactions(msg) {
  Object.values(chanceResponses)
    .some((v) => {
      const roll = Math.random();

      if (roll < v.chance / 100) {
        switch (v.type) {
        case "message":
          msg.reply(v.string);
          break;

        case "react":
          msg.react(v.string);
          break;

        case "react_custom":
          if (v.user === msg.author.id && Math.random() < 0.25) {
            const reaction = msg.guild.emojis.cache.find(
              (e) => e.name === v.string
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

function initialiseStats(guildId, userId) {
  const baseObj = {
    "bestRanking": "",
    "bestScore": 0,
    "decay": 0,
    "joinTime": 0,
    "lastGainTime": 0,
    "luckHandicap": 0,
    "luckTokens": 5,
    "messages": 0,
    "nerdEmojis": {},
    "nerdHandicap": 0,
    "nerdScore": 0,
    "nerdsGiven": 0,
    "prestige": 0,
    "previousMessages": 0,
    "previousVoiceTime": 0,
    "reputation": 0,
    "reputationTime": 0,
    "score": 0,
    "voiceTime": 0
  };

  if (!globalThis.stats[guildId][userId]) {
    globalThis.stats[guildId][userId] = baseObj;
    return null;
  }

  Object.entries(baseObj)
    .forEach(([
      k,
      v
    ]) => {
      if (!globalThis.stats[guildId][userId][k]) {
        globalThis.stats[guildId][userId][k] = v;
      }
    });

  Object.keys(globalThis.stats[guildId][userId])
    .forEach((k) => {
      if (baseObj[k] === undefined) {
        delete globalThis.stats[guildId][userId][k];
      }
    });

  return null;
}

function addToStats(a) {
  function f() {
    // Returns UNIX time in seconds.
    return Math.floor(Date.now() / 1000);
  }

  const {
    type,
    userId,
    guildId,
    messageId,
    giver
  } = a;
  const giverId = giver
    ? giver.id
    : 0;

  if (!globalThis.stats[guildId]) {
    globalThis.stats[guildId] = {
      "allowDecay": true,
      "luckTokenTime": 0,
      "rankUpChannel": ""
    };
  }

  if (!globalThis.stats[guildId].luckTokenTime) {
    // Post-casino update patch
    globalThis.stats[guildId].luckTokenTime = 0;
  }

  initialiseStats(guildId, userId);
  initialiseStats(guildId, giverId);

  switch (type) {
  case "init":
    // Used for setting up initial stat values
    return;

  case "message":
    if (
      f() - globalThis.stats[guildId][userId].lastGainTime <
        statsConfig.messageSRGainCooldown
    ) {
      return;
    }
    globalThis.stats[guildId][userId].lastGainTime = f();
    globalThis.stats[guildId][userId].messages += 1;
    break;

  case "joinedVoiceChannel":
    globalThis.stats[guildId][userId].joinTime = f();
    break;

  case "inVoiceChannel":
    if (botUptime < 10) {
      globalThis.stats[guildId][userId].joinTime = f();
    }
    globalThis.stats[guildId][userId].voiceTime += Math.floor(
      f() -
        (globalThis.stats[guildId][userId].joinTime === 0
          ? f()
          : globalThis.stats[guildId][userId].joinTime)
    );
    globalThis.stats[guildId][userId].joinTime = f();
    break;

  case "leftVoiceChannel":
    globalThis.stats[guildId][userId].voiceTime += Math.floor(
      f() - globalThis.stats[guildId][userId].joinTime
    );
    break;

  case "nerdEmojiAdded":
    if (!messageId) {
      return;
    }
    if (!giver.bot) {
      globalThis.stats[guildId][giverId].nerdsGiven++;
    }

    globalThis.stats[guildId][userId].nerdEmojis[messageId] =
        (globalThis.stats[guildId][userId].nerdEmojis[messageId] ?? 0) +
        1 +
        Math.floor(globalThis.stats[guildId][giverId].prestige / 2);
    break;

  case "nerdEmojiRemoved":
    if (!messageId) {
      return;
    }
    if (!giver.bot) {
      globalThis.stats[guildId][giverId].nerdsGiven = Math.max(
        0,
        (globalThis.stats[guildId][giverId].nerdsGiven ?? 0) - 1
      );
    }

    globalThis.stats[guildId][userId].nerdEmojis[messageId] = Math.max(
      0,
      globalThis.stats[guildId][userId].nerdEmojis[messageId] -
        (1 + Math.floor(globalThis.stats[guildId][giverId].prestige / 2))
    );
    break;

  default:
    break;
  }

  updateScores();
  saveStats();
}

function updateScores() {
  Object.entries(globalThis.stats)
    .forEach(([
      guild,
      guildStats
    ]) => {
      Object.keys(guildStats)
        .filter((k) => k.length === 18)
        .forEach(async (user) => {
          addToStats({
            "guildId": guild,
            "type": "init",
            "userId": user
          });
          const nerdPower =
            globalThis.stats[guild][user].prestige > 0
              ? 2.8
              : 1.8;
          globalThis.stats[guild][user].nerdScore =
            Object.values(globalThis.stats[guild][user].nerdEmojis)
              .reduce(
                (sum, a) => sum + Math.max(nerdPower ** a + 1, 0) - 1,
                0
              ) - globalThis.stats[guild][user].nerdHandicap;

          const score = Math.floor(
            (globalThis.stats[guild][user].voiceTime *
              statsConfig.voiceChatSRGain +
              globalThis.stats[guild][user].messages *
              statsConfig.messageSRGain) *
            Math.max(
              1 +
              globalThis.stats[guild][user].reputation *
              statsConfig.reputationGain,
              0.01
            ) *
            1.2 ** globalThis.stats[guild][user].prestige +
            globalThis.stats[guild][user].luckHandicap -
            globalThis.stats[guild][user].nerdScore -
            globalThis.stats[guild][user].decay
          );

          if (
            globalThis.stats[guild][user].score >
            statsConfig.prestigeRequirement &&
            globalThis.stats[guild][user].prestige < statsConfig.prestigeMaximum
          ) {
            globalThis.stats[guild][user].score =
              statsConfig.prestigeRequirement;
          } else {
            globalThis.stats[guild][user].score = score;
          }

          if (
            globalThis.stats[guild][user].score >
            globalThis.stats[guild][user].bestScore ||
            // Fix for bestScore being stuck at 50K after prestige
            globalThis.stats[guild][user].bestScore ===
            statsConfig.prestigeRequirement
          ) {
            globalThis.stats[guild][user].bestScore =
              globalThis.stats[guild][user].score;

            if (
              globalThis.stats[guild][user].bestRanking !==
              getRanking(globalThis.stats[guild][user].score) &&
              globalThis.stats[guild].rankUpChannel &&
              botUptime > 120
            ) {
              const guildObject = await client.guilds.fetch(guild);
              const userObject = guildObject.members.cache
                .filter((m) => m.id === user)
                .first();
              const channel = await guildObject.channels.fetch(
                globalThis.stats[guild].rankUpChannel
              );
              channel.send(
                `## Rank Up!\n\`\`\`ansi\n${
                  userObject.displayName
                } has reached rank ${getRanking(
                  globalThis.stats[guild][user].score
                )}!\`\`\``
              );
            }
            globalThis.stats[guild][user].bestRanking = getRanking(
              globalThis.stats[guild][user].score
            );
          }
        });
    });
}

function getRanking(score) {
  let rankString = "MISSINGNO";
  Object.entries(ranks)
    .forEach(([
      k,
      v
    ]) => {
      if (v[0] <= score) {
        rankString = `${v[1]}${k}\u001b[0m`;
      }
    });
  return rankString;
}

client.once(Events.ClientReady, (c) => {
  console.log(
    "Connected and ready to go!\n" +
    `Current date is ${date}, ` +
    `logged in as ${c.user.tag}\n`
  );

  checkVoiceChannels();
  checkBirthdays(true);
  checkMinecraftServer();
  getNewSplash();
  addDecayToStats();
  backupStats();
  addTokens();

  /* eslint-disable line-comment-position */
  setInterval(() => {
    botUptime += 10;
  }, getTime(10));
  setInterval(checkBirthdays, getTime(0, 15)); // 15 minutes
  setInterval(checkMinecraftServer, getTime(5)); // 5 seconds
  setInterval(getNewSplash, getTime(0, 0, 1)); // 1 hour
  setInterval(addDecayToStats, getTime(0, 0, 1)); // 1 hour
  setInterval(checkVoiceChannels, getTime(15)); // 15 seconds
  setInterval(saveStats, getTime(0, 3)); // 15 minutes
  setInterval(backupStats, getTime(0, 15)); // 15 minutes
  setInterval(addTokens, getTime(0, 0, 1)); // 1 hour
  /* eslint-enable line-comment-position */
});

client.on(Events.MessageCreate, async (msg) => {
  if (msg.author.bot || !msg.guild) {
    return;
  }
  if (msg.author.id === "269143269336809483") {
    console.log(`${getNickname(msg)} in ${msg.guild}: ${msg.content}`);
  }

  await checkMessageResponse(msg);
  checkMessageReactions(msg);

  addToStats({
    "guildId": msg.guild.id,
    "type": "message",
    "userId": msg.author.id
  });
});

client.on(Events.InteractionCreate, async (interaction) => {
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
        "content": "There was an error while executing this command!",
        "ephemeral": true
      });
    } else {
      await interaction.reply({
        "content": "There was an error while executing this command!",
        "ephemeral": true
      });
    }
  }
});

client.on(Events.VoiceStateUpdate, (oldState, newState) => {
  if (newState.member.bot) {
    return;
  }

  if (oldState.channel && !newState.channel) {
    addToStats({
      "guildId": newState.guild.id,
      "type": "leftVoiceChannel",
      "userId": newState.member.id
    });
  } else if (!oldState.channel && newState.channel) {
    addToStats({
      "guildId": newState.guild.id,
      "type": "joinedVoiceChannel",
      "userId": newState.member.id
    });
  }
});

client.on(Events.MessageReactionAdd, (reaction, user) => {
  if (reaction.emoji.name === "🤓") {
    addToStats({
      "giver": user,
      "guildId": reaction.message.guildId,
      "messageId": reaction.message.id,
      "type": "nerdEmojiAdded",
      "userId": reaction.message.author.id
    });
  }
});

client.on(Events.MessageReactionRemove, (reaction, user) => {
  if (reaction.emoji.name === "🤓") {
    addToStats({
      "giver": user,
      "guildId": reaction.message.guildId,
      "messageId": reaction.message.id,
      "type": "nerdEmojiRemoved",
      "userId": reaction.message.author.id
    });
  }
});

client.login(token);
