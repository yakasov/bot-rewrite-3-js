"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { baseStats } = require("../util/stats");
const { DISCORD_ID_LENGTH } = require("../util/consts");
const globals = require("../util/globals");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Reset all guild stats. Owner only"),
  execute: async (interaction) => {
    await interaction.client.application.fetch();
    if (
      interaction.user === interaction.client.application.owner ||
      interaction.user.id === (await interaction.guild.fetchOwner()).user.id
    ) {
      const stats = globals.get("stats");
      Object.entries(stats)
        .filter(([k]) => k === interaction.guild.id)
        .forEach(([guildId, guildStats]) => {
          Object.keys(guildStats)
            .filter((k) => k.length === DISCORD_ID_LENGTH)
            .forEach((userId) => {
              const userStats = stats[guildId][userId];
              const previousMessages =
                userStats.previousMessages + userStats.messages;
              const previousVoiceTime =
                userStats.previousVoiceTime + userStats.voiceTime;

              stats[guildId][userId] = structuredClone(baseStats);
              stats[guildId][userId].previousMessages = previousMessages;
              stats[guildId][userId].previousVoiceTime = previousVoiceTime;
            });
        });
    }

    return interaction.reply(
      `Reset all guild stats for guild ${interaction.guild.id}.`
    );
  },
};
