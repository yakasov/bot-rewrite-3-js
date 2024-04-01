const { SlashCommandBuilder } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
  aliases: ["disconnect", "leave"],
  data: new SlashCommandBuilder()
    .setName("dc")
    .setDescription("Disconnects the bot from voice chat"),
  async execute(interaction) {
    const conn = getVoiceConnection(interaction.guildId);
    if (conn) {
      conn.destroy();
    }
  },
};
