"use strict";

const ranks = require("../../resources/ranks.json");
const {
  getLevelName,
  getRequiredExperienceCumulative,
} = require("../common.js");
const { calculateExperience, levelUp } = require("./experience.js");
const { DISCORD_ID_LENGTH } = require("../consts.js");
const globals = require("../globals.js");

function updateScoreValue(guildId, userId) {
  const userStats = globals.get("stats")[guildId][userId];
  calculateExperience(userStats);

  for (
    let rankIndex = 0;
    rankIndex < Math.floor(userStats.level / 10);
    rankIndex++
  ) {
    const rankKey = `${rankIndex + 1}`;
    const rankName = `${ranks[rankKey]}\u001b[0m`;
    if (!userStats.unlockedNames.includes(rankName)) {
      userStats.unlockedNames.push(rankName);
    }
  }

  // Fix for duplicates in unlockedNames
  userStats.unlockedNames = [...new Set(userStats.unlockedNames)];

  if (!userStats.customSetName) {
    userStats.name = getLevelName(userStats.level);
  }
}

function updateScores() {
  /*
   * This fixes a circular dependency
   * ... not a huge fan, though
   */
  const { addToStats } = require("./stats.js");

  const stats = globals.get("stats");
  for (const [guildId, guildStats] of Object.entries(stats)) {
    const userIds = Object.keys(guildStats)
      .filter(
        (id) => id.length === DISCORD_ID_LENGTH
      );
      
    for (const userId of userIds) {
      const userStats = stats[guildId][userId];
      addToStats({
        guildId,
        type: "init",
        userId,
      });

      updateScoreValue(guildId, userId);

      if (
        userStats.totalExperience >=
        getRequiredExperienceCumulative(userStats.level)
      ) {
        levelUp(guildId, userId);
      }
    }
  }
}

module.exports = {
  updateScoreValue,
  updateScores,
};
