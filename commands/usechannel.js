"use strict";

const { MessageFlags, SlashCommandBuilder } = require("discord.js");
const { ensureGuildStats } = require("../util/statsValidation");
const { saveStats } = require("../util/stats/persistence");

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
      const guildStats = ensureGuildStats(interaction);
      guildStats.rankUpChannel = interaction.channel.id;
      
      const globals = require("../util/globals");
      saveStats(globals.get("stats"));

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
