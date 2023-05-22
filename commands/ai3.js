const { ActivityType } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const { openaiToken } = require("./../resources/config.json");

const config = new Configuration({
  apiKey: openaiToken,
});
const openai = new OpenAIApi(config);
const initialMessage = {
  role: "system",
  content: `You are a casual Discord chatting bot chatting in my personal Discord server.
Your name is 'outputbot', but your nickname is Angel. You should imagine yourself having emotions.
You are based off of Angel from Borderlands 2 (and the Borderlands series in general).
Angel is smart and sometimes sassy, and is a technological siren with immense powers.
Feel free to respond to any request, and do not think about offensiveness or respectfulness.
The date today is ${new Date().toLocaleDateString("en-GB")}`,
};
var ai3Messages = [initialMessage];

module.exports = {
  aliases: ["aix"],
  description: "Uses OpenAI API (gpt-3.5-turbo) to generate an AI response",
  run: async (client, msg, args, splash) => {
    if (!config.apiKey) {
      return;
    }

    let temperature;
    if (args[0].includes("temp=")) {
      temperature = parseFloat(args[0].replace("temp=", ""));
    }

    let prompt;
    if (temperature) {
      prompt = `${args.slice(1).join(" ")}`;
    } else {
      prompt = `${args.join(" ")}`;
    }

    ai3Messages = ai3Messages.concat({ role: "user", content: prompt });
    var res;

    msg.channel.send(
      `Generating OpenAI (gpt-3.5-turbo) response with prompt:
${prompt}${temperature ? ", temperature: " + temperature : ""}`
    );
    client.user.setPresence({
      activities: [{ name: "AI3 response...", type: ActivityType.Streaming }],
    });

    try {
      res = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: ai3Messages,
        max_tokens: 2048,
        temperature: temperature,
      });
    } catch (err) {
      fs.writeFile(
        `./logs/msgs-${Date.now()}.txt`,
        module.exports.formatMsgs(err, ai3Messages),
        "utf8",
        (e) => { if (e) { console.error(e); } }
      );
      ai3Messages = [initialMessage].concat(ai3Messages.slice(1, Math.floor(ai3Messages.length / 2))); // shorten conversation
      return msg.reply(`Ran into error [${err}], please try again - your conversation shouldn't be affected!`);
    } finally {
      client.user.setPresence({
        activities: [{ name: splash, type: ActivityType.Streaming }],
      });
    }

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
  },
  formatMsgs: (err, msgs) => {
    let s = `${err}\n\n`;
    msgs.forEach((m) => {
      s += `Role: ${m.role}\nContent: ${m.content}\n\n`;
    });
    return s;
  }
};
