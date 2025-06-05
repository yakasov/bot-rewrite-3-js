"use strict";

const baseStats = {
  achievementTracking: {},
  achievements: [],
  customSetName: false,
  joinTime: 0,
  lastDailyTime: 0,
  lastGainTime: 0,
  level: 0,
  levelExperience: 0,
  luckHandicap: 0,
  messages: 0,
  name: "",
  previousMessages: 0,
  previousVoiceTime: 0,
  totalExperience: 0,
  unlockedNames: [],
  voiceTime: 0
};

function initialiseStats(guildId, userId) {
  if (!globalThis.stats[guildId][userId]) {
    globalThis.stats[guildId][userId] = structuredClone(baseStats);
    return null;
  }

  Object.entries(baseStats)
    .forEach(([k, v]) => {
      if (globalThis.stats[guildId][userId][k] === undefined) {
        globalThis.stats[guildId][userId][k] = v;
      }
    });

  Object.keys(globalThis.stats[guildId][userId])
    .forEach((k) => {
      if (baseStats[k] === undefined) {
        delete globalThis.stats[guildId][userId][k];
      }
    });
  return null;
}

module.exports = {
  baseStats,
  initialiseStats
};
