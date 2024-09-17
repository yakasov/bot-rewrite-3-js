"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { baseStats } = require("../util/stats.js");

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("reset")
    .setDescription("Reset all guild stats. Owner only"),
  "execute": async (interaction) => {
    await interaction.client.application.fetch();
    if (
      interaction.user === interaction.client.application.owner ||
      interaction.user.id === (await interaction.guild.fetchOwner()).user.id
    ) {

      Object.entries(globalThis.stats)
        .filter(([k]) => k === interaction.guild.id)
        .forEach(([
          guildId,
          guildStats
        ]) => {
          Object.keys(guildStats)
            .filter((k) => k.length === 18)
            .forEach((userId) => {
              const previousMessages =
                globalThis.stats[guildId][userId].previousMessages +
                globalThis.stats[guildId][userId].messages;
              const previousVoiceTime =
                globalThis.stats[guildId][userId].previousVoiceTime +
                globalThis.stats[guildId][userId].voiceTime;

              globalThis.stats[guildId][userId] = baseStats;
              globalThis.stats[guildId][userId].previousMessages =
                previousMessages;
              globalThis.stats[guildId][userId].previousVoiceTime =
                previousVoiceTime;
            });
        });
    }
  }
};
