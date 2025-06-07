"use strict";

const { MessageFlags, SlashCommandBuilder } = require("discord.js");
const chanceResponses = require("../resources/chanceResponses.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("viewresponses")
    .setDescription("View the current responses roll table.")
    .addStringOption((opt) =>
      opt
        .setName("key")
        .setDescription("The response to view. Leave blank to see all keys")),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const key = interaction.options.getString("key") ?? "";

    if (key) {
      if (chanceResponses[key]) {
        return interaction.followUp({
          content: `\`\`\`json\n${JSON.stringify(chanceResponses[key], null, 2)}\n\`\`\``,
          flags: MessageFlags.Ephemeral
        });
      }
      return interaction.followUp({
        content: `Key "${key}" not found. Valid keys: ${Object.keys(
          chanceResponses
        )
          .join(", ")}`,
        flags: MessageFlags.Ephemeral
      });
    }

    return interaction.followUp({
      content: `Valid keys:\n\`\`\`\n${Object.keys(chanceResponses)
        .join(
          ", "
        )}\n\`\`\``,
      flags: MessageFlags.Ephemeral
    });
  }
};
