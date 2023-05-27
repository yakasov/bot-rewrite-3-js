const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
  aliases: ["disconnect", "leave"],
  description: "Disconnects the bot from voice chat",
  run: async (client, msg, args) => {
    const conn = getVoiceConnection(msg.guild.id);
    if (conn) {
      conn.destroy();
    }
  },
};
