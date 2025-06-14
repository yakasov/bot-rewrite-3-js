"use strict";

const { SlashCommandBuilder } = require("discord.js");
const OpenAI = require("openai");
const fs = require("fs");
const { openaiToken, aiChannels } = require("../resources/config.json");
const {
  AI_MAX_TOKENS,
  AI_MODEL,
  AI_REQUEST_ATTEMPTS,
  AI_DEFAULT_TEMP
} = require("../util/consts.js");

const openai = new OpenAI({
  apiKey: openaiToken
});
const initialMessage = {
  content: `You are a casual Discord chatting bot chatting in my personal 
  Discord server. Your name is 'outputbot'. Others may ask for you to act or 
  roleplay as something else, and you should try and carry out that request 
  if you can! Feel free to respond to any request.`,
  role: "system"
};
let conversation = [initialMessage];

function handleAIError(err, interaction, attempts, timestamp) {
  fs.writeFile(
    `./logs/ai-${interaction.user.id}-${timestamp}-${attempts}.txt`,
    formatMessages(err, conversation),
    "utf8",
    () => {
      // No callback
    }
  );

  if (err && err.error) {
    console.error(
      `\nAI Error Type: ${err.type}, message: ${err.error.message}`
    );
  }
}

function formatMessages(err, messages) {
  let string = `${err}\n\n`;
  messages.forEach((message) => {
    string += `Role: ${message.role}\nContent: ${message.content}\n\n`;
  });
  return string;
}

function shortenConversation() {
  return [initialMessage].concat(
    conversation.slice(Math.floor(conversation.length / 2), conversation.length)
  );
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("ai")
    .setDescription("Uses OpenAI API to generate an AI response")
    .addStringOption((opt) =>
      opt
        .setName("prompt")
        .setDescription("The prompt to give ChatGPT")
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
    const temperature =
      interaction.options.getNumber("temperature") ?? AI_DEFAULT_TEMP;

    if (!prompt || prompt.length < 2) {
      return interaction.followUp("Prompt too short.");
    }

    await interaction.followUp(`Given prompt: ${prompt}`);

    let res = "";
    let attempts = 0;
    const timestamp = Date.now();

    conversation = conversation.concat({
      content: prompt,
      role: "user"
    });

    while (attempts < AI_REQUEST_ATTEMPTS + 1 && !res) {
      try {
        attempts++;
        res = await openai.chat.completions.create({
          max_tokens: AI_MAX_TOKENS,
          messages: conversation,
          model: AI_MODEL,
          temperature
        });
      } catch (err) {
        handleAIError(err, interaction, attempts, timestamp);
        shortenConversation();
      }
    }

    if (res) {
      res = res.choices[0].message;
      conversation = conversation.concat(res);
      const resArray = res.content.match(/[\s\S]{1,2000}(?!\S)/gu);
      for (const r of resArray) {
        await interaction.followUp(r);
      }
    } else {
      await interaction.followUp(
        "Failed after 3 attempts, please try again - your conversation shouldn't be affected!"
      );
    }
  }
};
