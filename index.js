/* eslint-disable indent */
const { Client, Events, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const npFile = require("./commands/np.js");
const { token, prefix, statsConfig } = require("./resources/config.json");
const responses = require("./resources/responses.json");
const reactions = require("./resources/reactions.json");
const stats = require("./resources/stats.json");
const ranks = require("./resources/ranks.json");
const fetch = require("node-fetch");
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
const aliases = buildAliases();
var date = new Date().toLocaleDateString("en-GB").slice(0, -5);
var splash;

function buildAliases() {
  var aliases = {};
  const cmdFiles = fs.readdirSync("./commands");
  cmdFiles.forEach((file) => {
    const cmd = require(`./commands/${file}`);
    aliases[file.slice(0, -3)] = cmd.aliases;
  });
  return aliases;
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
            (Math.floor(Date.now() / 1000) - stats[guild][member]["joinTime"] >
              getTime(0, 0, 24) ||
              Math.floor(Date.now() / 1000) -
                stats[guild][member]["lastGainTime"] >
                getTime(0, 0, 24))
          ) {
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
  var stopProcessing = false;

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

    try {
      msg.delete();
    } catch (e) {
      msg.reply("Missing permissions to delete the above message!!");
    }
    stopProcessing = true;
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

  Object.entries(responses).forEach(async ([k, v]) => {
    if (
      ` ${msg.content.toLowerCase()} `.includes(` ${k} `) &&
      !stopProcessing
    ) {
      stopProcessing = true;
      await f(k, v);
    }
  });
}

async function checkMessageReactions(msg) {
  Object.keys(reactions).some((k) => {
    if (k === msg.author.id && Math.random() < 0.25) {
      const reaction = msg.guild.emojis.cache.find(
        (e) => e.name === reactions[k]
      );
      if (reaction) {
        msg.react(reaction);
      }
    }
  });

  if (Math.random() < 1 / 50) {
    await msg.react("🤓");
  }
}

async function addToStats(a, msg = null) {
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
  if (!stats[guildId][userId]) {
    stats[guildId][userId] = {
      messages: 0,
      voiceTime: 0,
      joinTime: 0,
      lastGainTime: 0,
      decay: 0,
      nerdEmojis: {},
      nerdsGiven: 0,
      score: 0,
      reputation: 0,
      reputationTime: 0,
      bestScore: 0,
      bestRanking: "",
      prestige: 0,
    };
  }
  if (!stats[guildId][giverId]) {
    stats[guildId][giverId] = {
      messages: 0,
      voiceTime: 0,
      joinTime: 0,
      lastGainTime: 0,
      decay: 0,
      nerdEmojis: {},
      nerdsGiven: 0,
      score: 0,
      reputation: 0,
      reputationTime: 0,
      bestScore: 0,
      bestRanking: "",
      prestige: 0,
    };
  }

  if (!stats[userId]["prestige"]) stats[userId]["prestige"] = 0;
  // yeah I might be retroactively adding this in...
  // I will add a system later to sort every stat individually if not initialised
  // ... TODO

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
        (stats[guildId][userId]["prestige"] ?? 0);
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
        (stats[guildId][userId]["nerdEmojis"][messageId] ?? 0) - 1
      );
      break;

    case "reputationGain":
      if (!giverId || giverId == userId) return msg ? msg.react("❌") : null;
      if (
        f() - (stats[guildId][giverId]["reputationTime"] ?? 0) <
        statsConfig["reputationGainCooldown"]
      ) {
        msg.reply(
          `You need to wait ${
            statsConfig["reputationGainCooldown"] -
            (f() - (stats[guildId][giverId]["reputationTime"] ?? 0))
          } more seconds first!`
        );
        return await msg.react("🕑");
      }
      stats[guildId][userId]["reputation"] =
        (stats[guildId][userId]["reputation"] ?? 0) +
        1 +
        (stats[guildId][userId]["prestige"] ?? 0);
      if (stats[guildId][userId]["reputation"] == 100)
        stats[guildId][userId]["reputation"] = -99;
      stats[guildId][giverId]["reputationTime"] = f();

      await msg.react("✅");
      break;

    case "reputationLoss":
      if (!giverId || giverId == userId) return msg ? msg.react("❌") : null;
      if (
        f() - (stats[guildId][giverId]["reputationTime"] ?? 0) <
        statsConfig["reputationGainCooldown"]
      ) {
        msg.reply(
          `You need to wait ${
            statsConfig["reputationGainCooldown"] -
            (f() - (stats[guildId][giverId]["reputationTime"] ?? 0))
          } more seconds first!`
        );
        return await msg.react("🕑");
      }
      stats[guildId][userId]["reputation"] =
        (stats[guildId][userId]["reputation"] ?? 0) -
        1 -
        (stats[guildId][userId]["prestige"] ?? 0);
      if (stats[guildId][userId]["reputation"] == -100)
        stats[guildId][userId]["reputation"] = 99;
      stats[guildId][giverId]["reputationTime"] = f();

      await msg.react("✅");
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
        stats[guild][user]["score"] = Math.max(
          0,
          Math.floor(
            stats[guild][user]["voiceTime"] *
              statsConfig["voiceChatSRGain"] *
              1.2 ** (stats[guild][user]["prestige"] + 1 ?? 1) +
              stats[guild][user]["messages"] *
                statsConfig["messageSRGain"] *
                1.2 ** (stats[guild][user]["prestige"] + 1 ?? 1) -
              Object.values(stats[guild][user]["nerdEmojis"]).reduce(
                (sum, a) => sum + Math.max(3.32 ** a + 1, 0) - 1,
                0
              ) -
              stats[guild][user]["decay"] +
              (stats[guild][user]["reputation"] ?? 0) *
                statsConfig["reputationGain"] -
              (stats[guild][user]["prestige"] ?? 0) *
                statsConfig["prestigeRequirement"]
          )
        );

        if (
          stats[guild][user]["score"] > (stats[guild][user]["bestScore"] ?? 0)
        ) {
          stats[guild][user]["bestScore"] = stats[guild][user]["score"];

          if (
            stats[guild][user]["bestRanking"] !=
              (await getRanking(stats[guild][user]["score"])) &&
            stats[guild]["rankUpChannel"]
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
                (await getRanking(stats[guild][user]["score"])) +
                "!```"
            );
          }
          stats[guild][user]["bestRanking"] = await getRanking(
            stats[guild][user]["score"]
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

  setInterval(checkBirthdays, getTime(0, 15)); // 15 minutes
  setInterval(checkMinecraftServer, getTime(5)); // 5 seconds
  setInterval(getNewSplash, getTime(0, 0, 1)); // 1 hour
  setInterval(addDecayToStats, getTime(0, 0, 1)); // 1 hour
  setInterval(checkVoiceChannels, getTime(15)); // 15 seconds
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.guild) return;
  if (msg.author.id == "269143269336809483") {
    console.log(`${getNickname(msg)} in ${msg.guild}: ${msg.content}`);
  }

  await checkMessageResponse(msg);
  await checkMessageReactions(msg);

  if (
    (msg.content.includes("+rep") || msg.content.includes("-rep")) &&
    msg.content.match(/<@(.*)>/)
  ) {
    if (!msg.content.includes("&")) {
      return await addToStats(
        {
          type: msg.content.includes("+rep")
            ? "reputationGain"
            : "reputationLoss",
          userId: msg.content.match(/<@(.*)>/)[1],
          guildId: msg.guild.id,
          messageId: 0,
          giver: { id: msg.author.id },
        },
        msg
      );
    }
  }

  if (!msg.content.toLowerCase().startsWith(prefix))
    return await addToStats({
      type: "message",
      userId: msg.author.id,
      guildId: msg.guild.id,
    });

  var args = msg.content.split(" ");
  var cmd = args.shift().slice(prefix.length).toLowerCase();

  if (!Object.keys(aliases).includes(cmd)) {
    Object.entries(aliases).forEach(([k, v]) => {
      if (v && v.includes(cmd)) {
        cmd = k;
      }
    });
  }

  try {
    var file = require(`./commands/${cmd}.js`);
    return file.run([client, msg, args]);
  } catch (err) {
    if (err.code && err.code !== "MODULE_NOT_FOUND") {
      console.error(err);
    }
  }
});

client.on("voiceStateUpdate", async (oldState, newState) => {
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

client.on("messageReactionAdd", async (reaction, user) => {
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

client.on("messageReactionRemove", async (reaction, user) => {
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
