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

module.exports = {
  conversation: [initialMessage],
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

    await interaction.followUp(`Given prompt: ${prompt}`);

    let res;
    let attempts = 0;
    const timestamp = Date.now();

    module.exports.conversation = module.exports.conversation.concat({
      role: "user",
      content: prompt,
    });

    while (attempts < 4 && !res) {
      try {
        attempts++;
        res = await openai.createChatCompletion({
          model: "gpt-4",
          messages: module.exports.conversation,
          max_tokens: 2048,
          temperature,
        });
      } catch (err) {
        fs.writeFile(
          `./logs/ai4-${interaction.user.id}-${timestamp}-${attempts}.txt`,
          module.exports.formatMsgs(err, module.exports.conversation),
          "utf8",
          () => {}
        );
        module.exports.conversation = [initialMessage].concat(
          module.exports.conversation.slice(
            Math.floor(module.exports.conversation.length / 2),
            module.exports.conversation.length
          )
        ); // Shorten conversation
      }
    }

    if (res) {
      res = res.data.choices[0].message;
      module.exports.conversation = module.exports.conversation.concat(res);
      const resArray = res.content.match(/[\s\S]{1,2000}(?!\S)/g);
      resArray.forEach(async (r) => {
        await interaction.followUp(r);
      });
    } else if (attempts == 3) {
        return await module.exports.returnFail(
          interaction,
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
  returnFail: async (m, r) => {
    await m.reactions.removeAll();
    await m.react(module.exports.reactions.fail);
    return m.reply(r);
  },
};
