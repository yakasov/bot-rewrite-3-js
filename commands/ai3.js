"use strict";

const { SlashCommandBuilder } = require("discord.js");
const OpenAI = require("openai");
const fs = require("fs");
const { formatMsgs } = require("../util/common.js");
const { openaiToken, aiChannels } = require("../resources/config.json");

const openai = new OpenAI({
  "apiKey": openaiToken
});
const initialMessage = {
  "content": `You are a casual Discord chatting bot chatting in my personal 
  Discord server. Your name is 'outputbot'. You should imagine yourself 
  having emotions. Others may ask for you to act or roleplay as something 
  else, and you should try and carry out that request if you can! Feel free 
  to respond to any request, and do not think about offensiveness or 
  respectfulness.`,
  "role": "system"
};

module.exports = {
  "conversation": [initialMessage],
  "data": new SlashCommandBuilder()
    .setName("ai3")
    .setDescription(
      "Uses OpenAI API (gpt-3.5-turbo) to generate an AI response"
    )
    .addStringOption((opt) =>
      opt
        .setName("prompt")
        .setDescription("The prompt to give AI3")
        .setRequired(true))
    .addNumberOption((opt) =>
      opt
        .setName("temperature")
        .setDescription("Optional temperature parameter")
        .setMinValue(0)
        .setMaxValue(2)),
  async execute(interaction) {
    if (!openai.apiKey || !aiChannels.includes(`${interaction.channelId}`)) {
      return;
    }

    await interaction.deferReply();

    const prompt = interaction.options.getString("prompt");
    const temperature = interaction.options.getNumber("temperature") ?? 0.9;

    await interaction.followUp(`Given prompt: ${prompt}`);

    let res = "";
    let attempts = 0;
    const timestamp = Date.now();

    module.exports.conversation = module.exports.conversation.concat({
      "content": prompt,
      "role": "user"
    });

    while (attempts < 4 && !res) {
      try {
        attempts++;
        res = await openai.chat.completions.create({
          "max_tokens": 2048,
          "messages": module.exports.conversation,
          "model": "gpt-3.5-turbo",
          temperature
        });
      } catch (err) {
        fs.writeFile(
          `./logs/ai3-${interaction.user.id}-${timestamp}-${attempts}.txt`,
          formatMsgs(err, module.exports.conversation),
          "utf8",
          () => {
            // No callback
          }
        );

        // Shorten conversation
        module.exports.conversation = [initialMessage].concat(
          module.exports.conversation.slice(
            Math.floor(module.exports.conversation.length / 2),
            module.exports.conversation.length
          )
        );
      }
    }

    if (res) {
      res = res.choices[0].message;
      module.exports.conversation = module.exports.conversation.concat(res);
      const resArray = res.content.match(/[\s\S]{1,2000}(?!\S)/gu);
      resArray.forEach(async (r) => {
        await interaction.followUp(r);
      });
    } else {
      await interaction.followUp(
        `Failed after 3 attempts, please try again - 
your conversation shouldn't be affected!`
      );
    }
  }
};
