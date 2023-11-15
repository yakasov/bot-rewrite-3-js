const { ActivityType } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const { openaiToken } = require("./../resources/config.json");

const config = new Configuration({
  apiKey: openaiToken,
});
const openai = new OpenAIApi(config);

module.exports = {
  aliases: ["ai2"],
  description: "Uses OpenAI API (text-davinci-002) to generate an AI response",
  run: async (client, msg, args, splash) => {
    if (!config.apiKey) {
      return;
    }

    let temperature, prompt, res;

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

    await msg.react(module.exports.reactions["start"]);

    try {
      res = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: prompt,
        temperature: temperature ?? 0.9,
        top_p: temperature ? null : 0.3,
        max_tokens: 1024,
        stop: ["<|endoftext|>"],
      });
    } catch (err) {
      fs.writeFile(
        `./logs/ai2-${msg.author.id}-${Date.now()}.txt`,
        `${err}\n\n${msg.content}`,
        "utf8",
        () => {}
      );
      return await module.exports.returnFail(
        msg,
        "Ran into an error! Try again?"
      );
    }

    if (res) {
      await msg.reactions.removeAll();
      await msg.react(module.exports.reactions["success"]);

      res = res.data.choices[0].text;
      const resArray = res.match(/[\s\S]{1,2000}(?!\S)/g);
      resArray.forEach((r) => {
        msg.reply(r);
      });
    }
  },
  reactions: {
    start: "🤔",
    temp: "🔥",
    success: "✅",
    fail: "❌",
  },
  returnFail: async (m, r) => {
    await m.reactions.removeAll();
    await m.react(module.exports.reactions["fail"]);
    return m.reply(r);
  },
};
