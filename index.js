/* eslint-disable indent */
const { Client, Events, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const npFile = require("./commands/np.js");
const { token, prefix, statsConfig } = require("./resources/config.json");
const responses = require("./resources/responses.json");
const reactions = require("./resources/reactions.json");
const stats = require("./resources/stats.json");
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

async function checkTweets() {
  try {
    const twitterCheck = require("./tasks/twitter.js");
    await twitterCheck.run(client);
  } catch (e) {
    return console.error(e);
  }
}

async function getNewSplash() {
  splash = await npFile.run(client, null, null);
}

function getNickname(msg) {
  return (
    msg.guild.members.cache.filter((m) => m.id == msg.author.id).first()
      .nickname ?? msg.author.username
  );
}

async function saveStats() {
  try {
    const saveStats = require("./tasks/saveStats.js");
    await saveStats.run(stats);
  } catch (e) {
    return console.error(e);
  }
}

async function addDecayToStats() {
  // This function should really be a separate task!!!
  Object.entries(stats).forEach(([guild, gv]) => {
    Object.keys(gv).forEach((member) => {
      if (stats[guild][member]["score"] > statsConfig["decaySRLossThreshold"]) {
        stats[guild][member]["decay"] += statsConfig["decaySRLoss"];
      }
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

    msg.delete();
    stopProcessing = true;
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

async function addToStats(id, guild, type, msgId = null) {
  function f() {
    // Returns UNIX time in seconds.
    return Math.floor(Date.now() / 1000);
  }

  if (!stats[guild]) stats[guild] = {};
  if (!stats[guild][id]) {
    stats[guild][id] = {
      messages: 0,
      voiceTime: 0,
      joinTime: 0,
      lastGainTime: 0,
      decay: 0,
      nerdEmojis: {},
    };
  }

  switch (type) {
    case "message":
      if (
        f() - stats[guild][id]["lastGainTime"] <
        statsConfig["messageSRGainCooldown"]
      )
        return;
      stats[guild][id]["lastGainTime"] = f();
      stats[guild][id]["messages"] += 1;
      break;

    case "joinedVoiceChannel":
      stats[guild][id]["joinTime"] = f();
      break;

    case "leftVoiceChannel":
      stats[guild][id]["voiceTime"] += Math.floor(
        f() - stats[guild][id]["joinTime"]
      );
      break;

    case "nerdEmojiAdded":
      if (!msgId) return;
      if (!stats[guild][id]["nerdsGiven"])
        stats[guild][id]["nerdsGiven"] = 0;
      stats[guild][id]["nerdsGiven"] += 1;

      if (!stats[guild][id]["nerdEmojis"][msgId])
        stats[guild][id]["nerdEmojis"][msgId] = 0;
      stats[guild][id]["nerdEmojis"][msgId] += 1;
      break;

    case "nerdEmojiRemoved":
      if (!msgId) return;
      if (!stats[guild][id]["nerdsGiven"])
        stats[guild][id]["nerdsGiven"] = 0;
      stats[guild][id]["nerdsGiven"] = Math.max(
          0,
          stats[guild][id]["nerdsGiven"] - 1
      );
      if (!stats[guild][id]["nerdEmojis"][msgId])
        stats[guild][id]["nerdEmojis"][msgId] = 0;
      stats[guild][id]["nerdEmojis"][msgId] -= Math.max(
        0,
        stats[guild][id]["nerdEmojis"][msgId] - 1
      );
      break;

    default:
      break;
  }

  await saveStats();
}

client.once(Events.ClientReady, async (c) => {
  console.log(
    "Connected and ready to go!\n" +
      `Current date is ${date}, ` +
      `logged in as ${c.user.tag}\n`
  );

  await checkBirthdays(true);
  await checkMinecraftServer();
  await checkTweets();
  await getNewSplash();

  setInterval(checkBirthdays, getTime(0, 15)); // 15 minutes
  setInterval(checkMinecraftServer, getTime(5)); // 5 seconds
  setInterval(checkTweets, getTime(0, 15)); // 15 minutes
  setInterval(getNewSplash, getTime(0, 0, 1)); // 1 hour
  setInterval(saveStats, getTime(15)); // 15 seconds
  setInterval(addDecayToStats, getTime(0, 0, 1)); // 1 hour
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.guild) return;
  if (msg.author.id == "269143269336809483") {
    console.log(`${getNickname(msg)} in ${msg.guild}: ${msg.content}`);
  }

  await checkMessageResponse(msg);
  await checkMessageReactions(msg);
  if (!msg.content.toLowerCase().startsWith(prefix)) {
    await addToStats(msg.author.id, msg.guild.id, "message");
    return;
  }

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
    if (
      ["ai", "ai3"].includes(cmd) &&
      ["bot", "chat-with-outputbot"].includes(msg.channel.name)
    ) {
      return file.run(client, msg, args, splash);
    } else {
      return file.run(client, msg, args);
    }
  } catch (err) {
    if (err.code && err.code !== "MODULE_NOT_FOUND") {
      console.error(err);
    }
  }
});

client.on("voiceStateUpdate", async (oldState, newState) => {
  if (oldState.channel && !newState.channel) {
    await addToStats(newState.member.id, newState.guild.id, "leftVoiceChannel");
  } else if (!oldState.channel && newState.channel) {
    await addToStats(
      newState.member.id,
      newState.guild.id,
      "joinedVoiceChannel"
    );
  }
});

client.on("messageReactionAdd", async (reaction, _) => {
  if (reaction.emoji.name == "🤓") {
    await addToStats(
      reaction.message.author.id,
      reaction.message.guildId,
      "nerdEmojiAdded",
      reaction.message.id
    );
  }
});

client.on("messageReactionRemove", async (reaction, _) => {
  if (reaction.emoji.name == "🤓") {
    await addToStats(
      reaction.message.author.id,
      reaction.message.guildId,
      "nerdEmojiRemoved",
      reaction.message.id
    );
  }
});

client.login(token);
