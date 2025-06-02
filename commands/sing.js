"use strict";

const { SlashCommandBuilder } = require("discord.js");
const {
  createAudioPlayer,
  joinVoiceChannel,
  createAudioResource
} = require("@discordjs/voice");
const ytdl = require("ytdl-core-discord");
const { YT_MAX_AUDIO_SIZE } = require("../util/consts");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sing")
    .setDescription("Streams from a YouTube url")
    .addStringOption((opt) =>
      opt
        .setName("url")
        .setDescription("The YouTube URL to stream from")
        .setRequired(true)),

  async execute(interaction) {
    await interaction.deferReply();

    const url = interaction.options.getString("url");
    if (
      !(/^https?:\/\/(?<subdomain>www\.)?youtube\.com\/watch\?v=/gu).test(url) &&
      !(/^https?:\/\/youtu\.be\//gu).test(url)
    ) {
      return interaction.editReply("Please provide a valid YouTube URL.");
    }

    const voiceChannelId = interaction.member.voice?.channelId;
    if (!voiceChannelId) {
      return interaction.editReply(
        "You must be in a voice channel to use this command!"
      );
    }

    try {
      const player = createAudioPlayer();
      joinVoiceChannel({
        adapterCreator: interaction.guild.voiceAdapterCreator,
        channelId: voiceChannelId,
        guildId: interaction.guild.id
      })
        .subscribe(player);

      const ytUrl = `${url}&bpctr=${Date.now()}&has_verified=1`;
      const stream = await ytdl(ytUrl, {
        filter: "audioonly",
        highWaterMark: YT_MAX_AUDIO_SIZE
      });
      const res = createAudioResource(stream);
      player.play(res);

      await interaction.editReply("Now playing!");
    } catch (e) {
      await interaction.editReply(`Error: ${e.message}`);
    }
  }
};
