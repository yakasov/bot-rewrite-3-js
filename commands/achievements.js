"use strict";

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("achievements")
    .setDescription("See your achievements"),
  execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    // TODO
  },
};
