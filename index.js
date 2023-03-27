const { Client, Events, GatewayIntentBits } = require("discord.js");
const responses = require("./resources/responses.json");
const reactions = require("./resources/reactions.json")
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

async function checkBirthdays(force = false) {
  var birthdays = require("./tasks/birthdays.js");
  date = await birthdays.run(client, date, force);
}

function checkMessageResponse(msg) {
  Object.keys(responses).some((k) => {
    if (` ${msg.content.toLowerCase()} `.includes(` ${k} `)) {
      var res = responses[k];

      if (res.includes("{AUTHOR}")) {
        res = res.replace("{AUTHOR}", msg.author.username);
      }

      if (res.includes("{FOLLOWING}")) {
        const following = msg.content.toLowerCase().split(k)[1];
        res = res.replace(
          "{FOLLOWING}",
          msg.content.trim() === k ? msg.author.username : following.trim()
        );
      }

      return msg.channel.send(res);
    }
  });
}

function checkMessageReactions(msg) {
  Object.keys(reactions).some((k) => {
    if (k === msg.author.id) {
      const reaction = msg.guild.emojis.cache.find(e => e.name === reactions[k])
      if (reaction) {
        msg.react(reaction);
      }
    }
  });
}

client.once(Events.ClientReady, (c) => {
  console.log(
    "Connected and ready to go!\n" +
      `Current date is ${date}, ` +
      `logged in as ${c.user.tag}`
  );

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

  try {
    var file = require(`./commands/${cmd}.js`);
    file.run(client, msg, args);
  } catch (err) {
    console.warn(err);
  }
});

client.login(token);
