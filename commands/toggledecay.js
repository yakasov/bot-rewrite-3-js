"use strict";

const { SlashCommandBuilder } = require("discord.js");
module.exports = {
  "data": new SlashCommandBuilder()
    .setName("toggledecay")
    .setDescription("Toggle decay for the current server (owner only)"),
  async execute(interaction) {
    await interaction.client.application.fetch();
    if (
      interaction.user === interaction.client.application.owner ||
      interaction.user.id === (await interaction.guild.fetchOwner()).user.id
    ) {
      globalThis.stats[interaction.guild.id].allowDecay =
        !globalThis.stats[interaction.guild.id].allowDecay;

      return interaction.reply(
        `Toggled decay for guild ${interaction.guild.name} (decay is now ${
          globalThis.stats[interaction.guild.id].allowDecay
        }).`
      );
    }

    return interaction.reply({
      "content": "You are not an admin user!",
      "ephemeral": true
    });
  }
};
