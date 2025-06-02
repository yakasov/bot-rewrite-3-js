"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { recalculateLevels } = require("../util/stats");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("recalculate")
    .setDescription("Recalculate all guild stats. Owner only"),
  execute: async (interaction) => {
    await interaction.client.application.fetch();
    if (
      interaction.user === interaction.client.application.owner ||
      interaction.user.id === (await interaction.guild.fetchOwner()).user.id
    ) {
      recalculateLevels();
    }

    return interaction.reply(
      `Recalculated all guild stats for guild ${interaction.guild.id}.`
    );
  },
};
