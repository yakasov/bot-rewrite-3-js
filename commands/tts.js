const { SlashCommandBuilder } = require("discord.js");
const {
  createAudioPlayer,
  joinVoiceChannel,
  createAudioResource,
} = require("@discordjs/voice");
const fs = require("node:fs");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("tts")
    .setDescription("Generate a TTS output from a given input")
    .addStringOption((opt) => {
      opt
        .setName("prompt")
        .setDescription("The prompt for TTS to say")
        .setRequired(true);
    }),
  async execute(interaction) {
    const prompt = interaction.options.getString("prompt");

    const player = createAudioPlayer();
    joinVoiceChannel({
      channelId: interaction.member.voice.channelId,
      guildId: interaction.guild.id,
      adapterCreator: interaction.guild.voiceAdapterCreator,
    }).subscribe(player);

    const response = await fetch(
      "https://tiktok-tts.weilnet.workers.dev/api/generation",
      {
        method: "post",
        body: JSON.stringify({
          text: prompt,
          voice: "en_us_001",
        }),
        headers: { "Content-Type": "application/json" },
      }
    );

    await response.json().then(async (r) => {
      if (r.data) {
        fs.writeFileSync("resources/tts.mp3", r.data, { encoding: "base64" });
        const res = createAudioResource("resources/tts.mp3");
        player.play(res);
      } else {
        await interaction.reply(r.error);
      }
    });
  },
};
