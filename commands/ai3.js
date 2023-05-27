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
      if (temperature > 2 || temperature < 0) {
        return msg.reply("Invalid temperature specified!");
      }
    }

    let prompt;
    if (temperature) {
      prompt = `${args.slice(1).join(" ")}`;
    } else {
      prompt = `${args.join(" ")}`;
    }

    ai3Messages = ai3Messages.concat({ role: "user", content: prompt });
    let res;
    let attempts = 0;
    let timestamp = Date.now();

    msg.channel.send(
      `Generating OpenAI (gpt-3.5-turbo) response with prompt:
${prompt}${temperature ? ", temperature: " + temperature : ""}`
    );
    client.user.setPresence({
      activities: [{ name: "AI3 response...", type: ActivityType.Streaming }],
    });

    while (attempts < 3 && !res) {
      try {
        attempts++;
        res = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: ai3Messages,
          max_tokens: 2048,
          temperature: temperature,
        });
      } catch (err) {
        fs.writeFile(
          `./logs/ai3-${msg.author.id}-${timestamp}-${attempts}.txt`,
          module.exports.formatMsgs(err, ai3Messages),
          "utf8",
          () => {}
        );
        ai3Messages = [initialMessage].concat(
          ai3Messages.slice(1, Math.floor(ai3Messages.length / 2))
        ); // shorten conversation
      }
    }

    client.user.setPresence({
      activities: [{ name: splash, type: ActivityType.Streaming }],
    });

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
    } else {
      return msg.reply(
        "Failed after 3 attempts, please try again - your conversation shouldn't be affected!"
      );
    }
  },
  formatMsgs: (err, msgs) => {
    let s = `${err}\n\n`;
    msgs.forEach((m) => {
      s += `Role: ${m.role}\nContent: ${m.content}\n\n`;
    });
    return s;
  },
};
