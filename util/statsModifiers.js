"use strict";

const { statsConfig } = require("../resources/config.json");

/*
 * The plan here is to override functions defined in stats.js.
 *
 * This allows me to apply 'seasonal modifiers' without messing with
 * the core functions - the modifiers will only apply to mainGuild.
 *
 * Essentially, if guildId === mainGuildId, use 'statsModifiers.func'
 * instead of 'stats.func'.
 */

module.exports = {
  overrideUpdateScoreValue: (guildId, userId) => {
    const score = Math.floor(
      (globalThis.stats[guildId][userId].voiceTime *
        statsConfig.voiceChatSRGain +
        globalThis.stats[guildId][userId].messages *
          statsConfig.messageSRGain) *
        Math.max(
          1 +
            globalThis.stats[guildId][userId].reputation *
              statsConfig.reputationGain,
          0.001
        ) *
        1.5 ** globalThis.stats[guildId][userId].prestige +
        globalThis.stats[guildId][userId].luckHandicap +
        globalThis.stats[guildId][userId].coolScore -
        globalThis.stats[guildId][userId].nerdScore
    );

    if (
      score > statsConfig.prestigeRequirement &&
      globalThis.stats[guildId][userId].prestige < statsConfig.prestigeMaximum
    ) {
      globalThis.stats[guildId][userId].score = statsConfig.prestigeRequirement;
    } else {
      globalThis.stats[guildId][userId].score = score;
    }
  },
};
