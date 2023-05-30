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
      return await module.exports.returnFail(msg, "No API key found!");
    }

    let temperature, prompt, res;
    let attempts = 0;
    let timestamp = Date.now();

    if (args[0].includes("temp=")) {
      temperature = parseFloat(args[0].replace("temp=", ""));
      if (temperature > 2 || temperature < 0) {
        return await module.exports.returnFail(
          msg,
          "Invalid temperature specified!"
        );
      }
    }

    if (temperature) {
      await msg.react(module.exports.reactions["temp"]);
      prompt = `${args.slice(1).join(" ")}`;
    } else {
      prompt = `${args.join(" ")}`;
    }

    ai3Messages = ai3Messages.concat({ role: "user", content: prompt });
    await msg.react(module.exports.reactions["start"]);
    await module.exports.setPresence(client, "AI3 response...");

    while (attempts < 4 && !res) {
      try {
        attempts++;
        await msg.react(module.exports.reactions[attempts]);
        res = await openai.createChatCompletion({
          model: "gpt-3.5-turbo",
          messages: ai3Messages,
          max_tokens: 2048,
          temperature: temperature ?? 0.9,
          top_p: temperature ? null : 0.3,
        });
      } catch (err) {
        if (attempts === 3) {
          fs.writeFile(
            `./logs/ai3-${msg.author.id}-${timestamp}-${attempts}.txt`,
            module.exports.formatMsgs(err, ai3Messages),
            "utf8",
            () => {}
          );
        }
        ai3Messages = [initialMessage].concat(
          ai3Messages.slice(1, Math.floor(ai3Messages.length / 2))
        ); // shorten conversation
      }
    }

    await module.exports.setPresence(client, splash);

    if (res) {
      await msg.reactions.removeAll();
      await msg.react(module.exports.reactions["success"]);

      res = res.data.choices[0].message;
      ai3Messages = ai3Messages.concat(res);
      const resArray = res.content.match(/[\s\S]{1,2000}(?!\S)/g);
      resArray.forEach((r) => {
        msg.reply(r);
      });
    } else {
      return await module.exports.returnFail(
        msg,
        "Failed after 3 attempts, please try again - your conversation shouldn't be affected!"
      );
    }
  },
  formatMsgs: (e, ms) => {
    let s = `${e}\n\n`;
    ms.forEach((m) => {
      s += `Role: ${m.role}\nContent: ${m.content}\n\n`;
    });
    return s;
  },
  reactions: {
    start: "🤔",
    temp: "🔥",
    1: "1️⃣",
    2: "2️⃣",
    3: "3️⃣",
    success: "✅",
    fail: "❌",
  },
  returnFail: async (m, r) => {
    await m.reactions.removeAll();
    await m.react(module.exports.reactions["fail"]);
    return m.reply(r);
  },
  setPresence: (c, p) => {
    return c.user.setPresence({
      activities: [{ name: p, type: ActivityType.Streaming }],
    });
  },
};
