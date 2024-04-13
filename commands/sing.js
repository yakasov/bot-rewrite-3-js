"use strict";

const { SlashCommandBuilder } = require("discord.js");
const {
  createAudioPlayer,
  joinVoiceChannel,
  createAudioResource
} = require("@discordjs/voice");
const ytdl = require("ytdl-core-discord");

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("sing")
    .setDescription("Streams from a YouTube url")
    .addStringOption((opt) =>
      opt
        .setName("url")
        .setDescription("The YouTube URL to stream from")
        .setRequired(true)
    ),

  async execute(interaction) {
    await interaction.deferReply();

    const url = interaction.options.getString("url");

    try {
      const player = createAudioPlayer();
      joinVoiceChannel({
        "adapterCreator": interaction.guild.voiceAdapterCreator,
        "channelId": interaction.member.voice.channelId,
        "guildId": interaction.guild.id
      }).subscribe(player);

      const res = createAudioResource(await ytdl(url));
      player.play(res);
    } catch (e) {
      await interaction.reply(e.message);
    }
  }
};
