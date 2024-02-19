const {
  createAudioPlayer,
  joinVoiceChannel,
  createAudioResource,
} = require("@discordjs/voice");
const ytdl = require("ytdl-core-discord");

module.exports = {
  aliases: ["play", "stream"],
  description: "Streams from a YouTube url",
  run: async (client, msg, args) => {
    if (!args.length) {
      return;
    }

    try {
      const player = createAudioPlayer();
      joinVoiceChannel({
        channelId: msg.member.voice.channelId,
        guildId: msg.guild.id,
        adapterCreator: msg.guild.voiceAdapterCreator,
      }).subscribe(player);

      const res = createAudioResource(await ytdl(args[0]));
      player.play(res);
    } catch (e) {
      msg.reply(e.message);
    }
  },
};
