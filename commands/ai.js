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

    const prompt = `${args.join(" ")}`;
    let res;

    await msg.react(module.exports.reactions["start"]);
    await module.exports.setPresence(client, "AI2 response...");

    try {
      res = await openai.createCompletion({
        model: "text-davinci-002",
        prompt: prompt,
        temperature: 0.9,
        top_p: 0.9,
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
      await msg.react(module.exports.reactions["fail"]);
      return msg.reply("Ran into an error! Try again?");
    }

    await module.exports.setPresence(client, splash);

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
    success: "✅",
    fail: "❌",
  },
  setPresence: (c, p) => {
    return c.user.setPresence({
      activities: [{ name: p, type: ActivityType.Streaming }],
    });
  },
};
