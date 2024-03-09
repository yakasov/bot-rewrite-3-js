const {
  createAudioPlayer,
  joinVoiceChannel,
  createAudioResource,
} = require("@discordjs/voice");
const fs = require("node:fs");

module.exports = {
  aliases: [],
  description: "Generate a TTS output from a given input",
  run: async ([, msg, args]) => {
    if (!args.length) {
      return;
    }

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
          text: args.join(" "),
          voice: "en_us_001",
        }),
        headers: { "Content-Type": "application/json" },
      }
    );

    await response.json().then((r) => {
      if (r.data) {
        fs.writeFileSync("resources/tts.mp3", r.data, { encoding: "base64" });
        const res = createAudioResource("resources/tts.mp3");
        player.play(res);
      } else {
        msg.reply(r.error);
      }
    });
  },
};
