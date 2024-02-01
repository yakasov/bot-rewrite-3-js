const {
  createAudioPlayer,
  joinVoiceChannel,
  createAudioResource,
} = require("@discordjs/voice");
const fs = require("node:fs");

module.exports = {
  aliases: [],
  description: "Generate a TTS output from a given input",
  run: async (client, msg, args) => {
    // if (!args.length) {
    //   return;
    // }

    const player = createAudioPlayer();
    joinVoiceChannel({
      channelId: msg.member.voice.channelId,
      guildId: msg.guild.id,
      adapterCreator: msg.guild.voiceAdapterCreator,
    }).subscribe(player);

    const response = await fetch(
      "https://tiktok-tts.weilnet.workers.dev/api/generation",
      {
        method: "post",
        body: JSON.stringify({
          text: "The fungus among us",
          voice: "en_us_001",
        }),
        headers: { "Content-Type": "application/json" },
      }
    );
    const data = await response.json();

    const res = createAudioResource(
      await module.exports.audioToBase64(`data:audio/mpeg;base64,${data.data}`)
    );
    player.play(res);
  },
  audioToBase64: async (audioFile) => {
    return new Promise((resolve, reject) => {
      let reader = new fs();
      reader.onerror = reject;
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(audioFile);
    });
  },
};
