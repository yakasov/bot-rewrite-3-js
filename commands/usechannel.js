"use strict";

const { MessageFlags, SlashCommandBuilder } = require("discord.js");
const globals = require("../util/globals");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("usechannel")
    .setDescription("Designates the channel to use for rank up messages"),
  async execute(interaction) {
    await interaction.client.application.fetch();
    if (
      interaction.user === interaction.client.application.owner ||
      interaction.user.id === (await interaction.guild.fetchOwner()).user.id
    ) {
      globals.get("stats")[interaction.guild.id].rankUpChannel =
        interaction.channel.id;

      return interaction.reply(
        `Set the rank up channel to ${interaction.channel.name}.`
      );
    }

    return interaction.reply({
      content: "You are not an admin user!",
      flags: MessageFlags.Ephemeral,
    });
  },
};
