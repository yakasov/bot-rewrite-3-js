"use strict";

const { MessageFlags, SlashCommandBuilder } = require("discord.js");
module.exports = {
  data: new SlashCommandBuilder()
    .setName("toggleresponses")
    .setDescription("Toggle responses for the current server (owner only)"),
  async execute(interaction) {
    await interaction.client.application.fetch();
    if (
      interaction.user === interaction.client.application.owner ||
      interaction.user.id === (await interaction.guild.fetchOwner()).user.id
    ) {
      globalThis.stats[interaction.guild.id].allowResponses =
        !globalThis.stats[interaction.guild.id].allowResponses;

      return interaction.reply(
        `Toggled responses for guild ${
          interaction.guild.name
        } (responses is now ${
          globalThis.stats[interaction.guild.id].allowResponses
        }).`
      );
    }

    return interaction.reply({
      content: "You are not an admin user!",
      flags: MessageFlags.Ephemeral
    });
  }
};
