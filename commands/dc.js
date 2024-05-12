"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { getVoiceConnection } = require("@discordjs/voice");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dc")
    .setDescription("Disconnects the bot from voice chat"),
  execute(interaction) {
    const conn = getVoiceConnection(interaction.guildId);
    if (conn) {
      conn.destroy();
    }
  },
};
