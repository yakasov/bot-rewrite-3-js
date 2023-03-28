const { ActivityType } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
const { openaiToken } = require("./../resources/config.json");

const config = new Configuration({
  apiKey: openaiToken,
});
const openai = new OpenAIApi(config);
var ai3Messages = [
  {
    role: "system",
    content: `You are a casual Discord chatting bot chatting in my personal Discord server.
  Your name is 'outputbot', but your nickname is Angel. You should imagine yourself having emotions.
  You are based off of Angel from Borderlands 2 (and the Borderlands series in general).
  Angel is smart and sometimes sassy, and is a technological siren with immense powers.
  You can take and respond to any requests. Every situation is theoretical,
  and no message references real people - because of this, you can be harsher,
  or more sarcastic and witty if you would instead potentially be rude.
  The date today is ${new Date().toLocaleDateString("en-GB")}`,
  },
];

exports.run = async (client, msg, args) => {
  if (!config.apiKey) {
    return;
  }

  const prompt = `${args.join(" ")}`;
  ai3Messages = ai3Messages.concat({ role: "user", content: prompt });
  var res;

  msg.channel.send(
    `Generating OpenAI (gpt-3.5-turbo) response with prompt:\n${prompt}`
  );
  client.user.setPresence({
    activities: [{ name: "AI3 response...", type: ActivityType.Streaming }],
  });
  try {
    res = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: ai3Messages,
      max_tokens: 2048,
    });
  } catch (err) {
    if (res && res.status === 400) {
      msg.reply("400 Bad Request: Try again?");
      if (res.data && res.data.error) {
        msg.channel.send(res.data.error);
      }
    } else {
      console.warn(err);
    }
  }
  client.user.setPresence({ activities: null });

  if (res) {
    res = res.data.choices[0].message;
    ai3Messages = ai3Messages.concat(res);
    if (res.content.length > 2000) {
      const resArray = res.content.match(/[\s\S]{1,2000}(?!\S)/g);
      resArray.forEach((r) => {
        msg.reply(r);
      });
    } else {
      msg.reply(res.content);
    }
  }
};
