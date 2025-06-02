const ranks = require("../../resources/ranks.json");
const {
  getLevelName,
  getRequiredExperienceCumulative,
} = require("../common.js");
const { addToStats, calculateExperience, levelUp } = require("./index.js");

function updateScoreValue(guildId, userId) {
  const userStats = calculateExperience(globalThis.stats[guildId][userId]);

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
  for (const [guildId, guildStats] of Object.entries(globalThis.stats)) {
    const userIds = Object.keys(guildStats).filter(
      (id) => id.length === DISCORD_ID_LENGTH
    );
    for (const userId of userIds) {
      addToStats({
        guildId,
        type: "init",
        userId,
      });

      updateScoreValue(guildId, userId);

      if (
        globalThis.stats[guildId][userId].totalExperience >=
        getRequiredExperienceCumulative(globalThis.stats[guildId][userId].level)
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
