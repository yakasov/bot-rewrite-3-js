"use strict";

const { SlashCommandBuilder } = require("discord.js");
const {
  createAudioPlayer,
  joinVoiceChannel,
  createAudioResource,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core-discord");
const {
  YT_MAX_AUDIO_SIZE,
  REGEX_YOUTUBE_URL_FULL,
  REGEX_YOUTUBE_URL_SHORT,
} = require("../util/consts");

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
      !REGEX_YOUTUBE_URL_FULL.test(url) &&
      !REGEX_YOUTUBE_URL_SHORT.test(url)
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
        guildId: interaction.guild.id,
      })
        .subscribe(player);

      const ytUrl = `${url}&bpctr=${Date.now()}&has_verified=1`;
      const stream = await ytdl(ytUrl, {
        filter: "audioonly",
        highWaterMark: YT_MAX_AUDIO_SIZE,
      });
      const res = createAudioResource(stream);
      player.play(res);

      await interaction.editReply("Now playing!");
    } catch (err) {
      await interaction.editReply(`Error: ${err.message}`);
    }
  },
};
