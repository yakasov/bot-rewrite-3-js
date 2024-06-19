"use strict";

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("reset")
    .setDescription("???"),
  execute: async (interaction) => {
    await interaction.client.application.fetch();
    if (
      interaction.user === interaction.client.application.owner ||
      interaction.user.id === (await interaction.guild.fetchOwner()).user.id
    ) {
      const baseObj = {
        bestRanking: "",
        bestScore: 0,
        coolEmojis: {},
        coolHandicap: 0,
        coolScore: 0,
        coolsGiven: 0,
        joinTime: 0,
        lastGainTime: 0,
        luckHandicap: 0,
        luckTokens: 5,
        messages: 0,
        nerdEmojis: {},
        nerdHandicap: 0,
        nerdScore: 0,
        nerdsGiven: 0,
        prestige: 0,
        previousMessages: 0,
        previousVoiceTime: 0,
        reputation: 0,
        reputationTime: 0,
        score: 0,
        voiceTime: 0,
      };

      Object.entries(globalThis.stats)
        .filter(([k, ]) => k === interaction.guild.id)
        .forEach(([guildId, guildStats]) => {
          Object.keys(guildStats)
            .filter((k) => k.length === 18)
            .forEach((userId) => {
              const previousMessages =
                globalThis.stats[guildId][userId].previousMessages +
                globalThis.stats[guildId][userId].messages;
              const previousVoiceTime =
                globalThis.stats[guildId][userId].previousVoiceTime +
                globalThis.stats[guildId][userId].voiceTime;

              globalThis.stats[guildId][userId] = baseObj;
              globalThis.stats[guildId][userId].previousMessages =
                previousMessages;
              globalThis.stats[guildId][userId].previousVoiceTime =
                previousVoiceTime;
            });
        });
    }
  },
};
