"use strict";

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("reset")
    .setDescription("???"),
  execute: async (interaction) => {
    await interaction.client.application.fetch();
    if (
      interaction.user === interaction.client.application.owner ||
      interaction.user.id === (await interaction.guild.fetchOwner()).user.id
    ) {
      return true;
    }
    
    return false;
  }
};
