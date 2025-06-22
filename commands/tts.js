"use strict";

const { SlashCommandBuilder } = require("discord.js");
const {
  createAudioPlayer,
  joinVoiceChannel,
  createAudioResource
} = require("@discordjs/voice");
const fs = require("node:fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tts")
    .setDescription("Generate a TTS output from a given input")
    .addStringOption((opt) =>
      opt
        .setName("prompt")
        .setDescription("The prompt for TTS to say")
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply();

    const prompt = interaction.options.getString("prompt");

    const player = createAudioPlayer();
    joinVoiceChannel({
      adapterCreator: interaction.guild.voiceAdapterCreator,
      channelId: interaction.member.voice.channelId,
      guildId: interaction.guild.id
    })
      .subscribe(player);

    await fetch(
      "https://tiktok-tts.weilnet.workers.dev/api/generation",
      {
        body: JSON.stringify({
          text: prompt,
          voice: "en_us_001"
        }),
        headers: { "Content-Type": "application/json" },
        method: "post"
      }
    )
      .then((response) => response.json())
      .then(async (response) => {
        if (response.data) {
          fs.writeFileSync("resources/tts.mp3", response.data, { encoding: "base64" });
          const res = createAudioResource("resources/tts.mp3");
          player.play(res);
        } else {
          await interaction.reply(response.error);
        }
      });
  }
};
