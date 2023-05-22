const { Client, Events, GatewayIntentBits } = require("discord.js");
const fs = require("fs");
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
  } catch {
    return;
  }
}

function checkMessageResponse(msg) {
  Object.entries(responses).some(([k, v]) => {
    if (` ${msg.content.toLowerCase()} `.includes(` ${k} `)) {

      if (v.includes("{AUTHOR}")) {
        v = v.replace("{AUTHOR}", msg.author.username);
      }

      if (v.includes("{FOLLOWING}")) {
        const following = msg.content.toLowerCase().split(k).slice(1).join(k);
        v = v.replace(
          "{FOLLOWING}",
          msg.content.trim() === k || !following.trim()
            ? msg.author.username
            : following.trim()
        );
      }

      if (v.includes("{STICKER:")) {
        const stickerId = v.split(":")[1].slice(0, -1);
        const sticker = msg.guild.stickers.cache.filter(s => s.id === stickerId);
        if (sticker) {
          return msg.channel.send({
            stickers: sticker
          });
        }
      }

      return msg.channel.send(v);
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

client.once(Events.ClientReady, async (c) => {
  console.log(
    "Connected and ready to go!\n" +
      `Current date is ${date}, ` +
      `logged in as ${c.user.tag}`
  );
  
  const npFile = require("./commands/np.js");
  splash = await npFile.run(client, null, null);
  checkBirthdays(true);
  setInterval(checkBirthdays, 900000);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.guild) return;

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
    if (["ai", "ai3"].includes(cmd) && ["bot", "chat-with-outputbot"].includes(msg.channel.name)) {
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

client.login(token);
