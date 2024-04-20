"use strict";

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("tokens")
    .setDescription("See how many tokens you have remaining."),
  execute(interaction) {
    interaction.reply({ "content": module.exports.getTokenString(
      globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens
    ),
    "ephemeral": true });
  },
  getTokenString(tokens) {
    if (tokens) {
      return `You have ${tokens} token${tokens === 1
        ? ""
        : "s"} left.`;
    }
    return "You have no more tokens!";
  }
};
