const { ActivityType, Client, Events, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
const aliases = require("./commands/aliases.json");
const responses = require("./resources/responses.json");
const reactions = require("./resources/reactions.json");
const { token, prefix } = require("./resources/config.json");

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
});
var date = new Date().toLocaleDateString("en-GB").slice(0, -5);
var splash;

async function checkBirthdays(force = false) {
  try {
    var birthdays = require("./tasks/birthdays.js");
    date = await birthdays.run(client, date, force);
  } catch {
    return;
  }
}

function checkMessageResponse(msg) {
  Object.keys(responses).some((k) => {
    if (` ${msg.content.toLowerCase()} `.includes(` ${k} `)) {
      var res = responses[k];

      if (res.includes("{AUTHOR}")) {
        res = res.replace("{AUTHOR}", msg.author.username);
      }

      if (res.includes("{FOLLOWING}")) {
        const following = msg.content.toLowerCase().split(k).slice(1).join(k);
        res = res.replace(
          "{FOLLOWING}",
          msg.content.trim() === k || !following.trim()
            ? msg.author.username
            : following.trim()
        );
      }

      return msg.channel.send(res);
    }
  });
}

function checkMessageReactions(msg) {
  Object.keys(reactions).some((k) => {
    if (k === msg.author.id) {
      const reaction = msg.guild.emojis.cache.find(e => e.name === reactions[k]);
      if (reaction) {
        msg.react(reaction);
      }
    }
  });
}

function setPresence() {
  const splashes = fs.readFileSync("./resources/splashes.txt", "utf-8").split("\n");
  splash = splashes[Math.floor(Math.random() * splashes.length)];
  client.user.setPresence({
    activities: [{ name: splash, type: ActivityType.Streaming }],
  });
}

client.once(Events.ClientReady, (c) => {
  console.log(
    "Connected and ready to go!\n" +
      `Current date is ${date}, ` +
      `logged in as ${c.user.tag}`
  );

  setPresence();
  checkBirthdays(true);
  setInterval(checkBirthdays, 900000);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot) return;
  if (!msg.guild) return;

  checkMessageResponse(msg);
  checkMessageReactions(msg);
  if (!msg.content.toLowerCase().startsWith(prefix)) return;

  var args = msg.content.split(" ");
  var cmd = args.shift().slice(prefix.length).toLowerCase();

  if (!Object.keys(aliases).includes(cmd)) {
    Object.entries(aliases).forEach(([k, v]) => {
      if (v.includes(cmd)) {
        cmd = k;
      }
    });
  }

  try {
    var file = require(`./commands/${cmd}.js`);
    if (["ai", "ai3"].includes(cmd)) {
      file.run(client, msg, args, splash);
    } else {
      file.run(client, msg, args);
    }
  } catch (err) {
    if (err.code && err.code !== "MODULE_NOT_FOUND") {
      console.error(err);
    }
  }
});

client.login(token);
