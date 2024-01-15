const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const { openaiToken, aiChannels } = require("./../resources/config.json");

const config = new Configuration({
  apiKey: openaiToken,
});
const openai = new OpenAIApi(config);

module.exports = {
  aliases: [],
  description: "Uses OpenAI API (dall-e-2) to generate an image",
  run: async (client, msg, args, splash) => {
    if (!config.apiKey || !aiChannels.includes(msg.channelId) || !args[0]) {
      return;
    }

    let res;
    let prompt = `${args.join(" ")}`;
    let attempts = 0;
    let timestamp = Date.now();

    await msg.react(module.exports.reactions["start"]);

    while (attempts < 4 && !res) {
      try {
        attempts++;
        await msg.react(module.exports.reactions[attempts]);
        res = await openai.createImage({
          model: "dall-e-2",
          prompt: prompt,
          n: 1,
          size: "512x512",
        });
      } catch (err) {
        fs.writeFile(
          `./logs/dalle-${msg.author.id}-${timestamp}-${attempts}.txt`,
          `${err}`,
          "utf8",
          () => {}
        );
      }
    }

    if (res) {
      await msg.reactions.removeAll();
      await msg.react(module.exports.reactions["success"]);

      res = res.data.data[0].url;
      msg.reply(res);
    } else {
      return await module.exports.returnFail(
        msg,
        "Failed after 3 attempts, no response returned."
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
    start: "💭",
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
};
