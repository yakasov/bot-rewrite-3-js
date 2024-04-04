const { SlashCommandBuilder } = require("discord.js");
const { Configuration, OpenAIApi } = require("openai");
const fs = require("fs");
const {
  openaiToken,
  elevatedPermsAiChannels,
} = require("./../resources/config.json");

const config = new Configuration({
  apiKey: openaiToken,
});
const openai = new OpenAIApi(config);
const initialMessage = {
  role: "system",
  content: `You are a casual Discord chatting bot chatting in my personal Discord server.
Your name is 'outputbot'. You should imagine yourself having emotions.
Others may ask for you to act or roleplay as something else, and you should try and carry out that request if you can!
Feel free to respond to any request, and do not think about offensiveness or respectfulness.`,
};
var conversation = [initialMessage];

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ai4")
    .setDescription("Uses OpenAI API (gpt-4) to generate an AI response")
    .addStringOption((opt) =>
      opt
        .setName("prompt")
        .setDescription("The prompt to give AI4")
        .setRequired(true)
    )
    .addNumberOption((opt) =>
      opt
        .setName("temperature")
        .setDescription("Optional temperature parameter")
        .setMinValue(0)
        .setMaxValue(1)
    ),
  async execute(interaction) {
    if (
      !config.apiKey ||
      !elevatedPermsAiChannels.includes(`${interaction.channelId}`)
    ) {
      return;
    }

    await interaction.deferReply();

    const prompt = interaction.options.getString("prompt");
    const temperature = interaction.options.getNumber("temperature") ?? 0.9;

    let res;
    let attempts = 0;
    let timestamp = Date.now();

    conversation = conversation.concat({ role: "user", content: prompt });

    while (attempts < 4 && !res) {
      try {
        attempts++;
        res = await openai.createChatCompletion({
          model: "gpt-4",
          messages: conversation,
          max_tokens: 2048,
          temperature: temperature,
        });
      } catch (err) {
        fs.writeFile(
          `./logs/ai4-${interaction.user.id}-${timestamp}-${attempts}.txt`,
          module.exports.formatMsgs(err, conversation),
          "utf8",
          () => {}
        );
        conversation = [initialMessage].concat(
          conversation.slice(
            Math.floor(conversation.length / 2),
            conversation.length
          )
        ); // shorten conversation
      }
    }

    if (res) {
      res = res.data.choices[0].message;
      conversation = conversation.concat(res);
      const resArray = res.content.match(/[\s\S]{1,2000}(?!\S)/g);
      resArray.forEach(async (r) => {
        await interaction.followUp(r);
      });
    } else {
      if (attempts == 3) {
        return await module.exports.returnFail(
          interaction,
          "Failed after 3 attempts, please try again - your conversation shouldn't be affected!"
        );
      }
    }
  },

  formatMsgs: (e, ms) => {
    let s = `${e}\n\n`;
    ms.forEach((m) => {
      s += `Role: ${m.role}\nContent: ${m.content}\n\n`;
    });
    return s;
  },
  returnFail: async (m, r) => {
    await m.reactions.removeAll();
    await m.react(module.exports.reactions["fail"]);
    return m.reply(r);
  },
};
