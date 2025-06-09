"use strict";

const { MessageFlags, SlashCommandBuilder } = require("discord.js");
const globals = require("../util/globals");
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
      const guildStats = globals.get("stats")[interaction.guild.id];
      guildStats.allowResponses = !guildStats.allowResponses;

      return interaction.reply(
        `Toggled responses for guild ${
          interaction.guild.name
        } (responses is now ${guildStats.allowResponses}).`
      );
    }

    return interaction.reply({
      content: "You are not an admin user!",
      flags: MessageFlags.Ephemeral,
    });
  },
};
