"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { statsConfig } = require("../resources/config.json");

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("tokens")
    .setDescription("See how many tokens you have remaining."),
  execute(interaction) {
    const tokenString = module.exports.getTokenString(
      globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens
    );
    interaction.reply({ "content":
      `${tokenString}\n\nYou will gain ${
        statsConfig.tokenRefreshAmount} tokens ${
        module.exports.getTimestamp(interaction)
      }.`,
    "ephemeral": true });
  },
  getTimestamp(interaction) {
    const unixTime = globalThis.stats[interaction.guild.id].luckTokenTime +
      86400;
    return `<t:${unixTime}:R>`;
  },
  getTokenString(tokens) {
    if (tokens) {
      return `You have ${tokens} token${tokens === 1
        ? ""
        : "s"} left.`;
    }
    return "You have no more tokens!\n\nWait, or get more with /sell!";
  }
};
