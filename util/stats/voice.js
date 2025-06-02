const { DISCORD_VOICE_CHANNEL_TYPE } = require("../consts.js");
const { addToStats } = require("./index.js");

function checkVoiceChannels() {
  const guilds = globalThis.client.guilds.cache;
  guilds.forEach((guild) => {
    const channels = guild.channels.cache.filter(
      (channel) => channel.type === DISCORD_VOICE_CHANNEL_TYPE
    );
    channels.forEach((channel) => {
      channel.members.forEach((member) => {
        addToStats({
          guildId: member.guild.id,
          type: "inVoiceChannel",
          userId: member.user.id,
        });
      });
    });
  });
}

module.exports = {
  checkVoiceChannels,
};
