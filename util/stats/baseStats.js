"use strict";

const globals = require("../globals");

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
  voiceTime: 0,
};

function initialiseStats(guildId, userId) {
  const stats = globals.get("stats");
  const userStats = stats[guildId][userId];
  if (!userStats) {
    stats[guildId][userId] = structuredClone(baseStats);
    return null;
  }

  Object.entries(baseStats)
    .forEach(([k, v]) => {
      if (userStats[k] === undefined) {
        userStats[k] = v;
      }
    });

  Object.keys(userStats)
    .forEach((k) => {
      if (baseStats[k] === undefined) {
        delete userStats[k];
      }
    });
  return null;
}

module.exports = {
  baseStats,
  initialiseStats,
};
