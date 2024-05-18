"use strict";

const { SlashCommandBuilder } = require("discord.js");
const chanceResponses = require("../resources/chanceResponses.json");

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("viewresponses")
    .setDescription("View the current responses roll table.")
    .addStringOption((opt) =>
      opt
        .setName("key")
        .setDescription("The response to view. Leave blank to see all keys")),
  async execute(interaction) {
    await interaction.deferReply({ "ephemeral": true });

    const key = interaction.options.getString("key") ?? "";

    if (key && chanceResponses[key]) {
      return interaction.followUp(
        JSON.stringify(chanceResponses[key], null, 4)
      );
    }

    return interaction.followUp(
      `Valid keys: ${Object.keys(chanceResponses)
        .join(", ")}`
    );
  }
};
