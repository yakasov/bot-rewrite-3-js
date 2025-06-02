const { statsConfig } = require("../../resources/config.json");
const {
  getRequiredExperience,
  getRequiredExperienceCumulative,
  getLevelName,
} = require("../common.js");
const { sendMessage } = require("./index.js");

function calculateExperience(userStats) {
  const exp = Math.floor(
    userStats.voiceTime * statsConfig.voiceChatSRGain +
      userStats.messages * statsConfig.messageSRGain +
      userStats.luckHandicap
  );

  userStats.levelExperience = Math.max(
    exp - getRequiredExperienceCumulative(userStats.level - 1),
    0
  );
  userStats.totalExperience = Math.max(exp, userStats.totalExperience);

  return userStats;
}

function levelUp(guildId, userId) {
  globalThis.stats[guildId][userId] = updateStatsOnLevelUp(
    globalThis.stats[guildId][userId]
  );

  if (globalThis.stats[guildId][userId].level % 10 === 0) {
    sendMessage([
      guildId,
      userId,
      "Level Up",
      `level ${globalThis.stats[guildId][userId].level}`,
      getLevelName(globalThis.stats[guildId][userId].level),
    ]);
  }
}

function recalculateLevels() {
  for (const [guildId, guildStats] of Object.entries(globalThis.stats)) {
    const userIds = Object.keys(guildStats).filter(
      (id) => id.length === DISCORD_ID_LENGTH
    );
    for (const userId of userIds) {
      let userStats = globalThis.stats[guildId][userId];
      userStats.level = 0;
      userStats.levelExperience = 0;
      userStats.totalExperience = 0;
      userStats = calculateExperience(globalThis.stats[guildId][userId]);

      while (
        userStats.totalExperience >
        getRequiredExperienceCumulative(userStats.level)
      ) {
        userStats.level++;
      }

      if (!userStats.customSetName) {
        userStats.name = getLevelName(userStats.level);
      }
    }
  }
}

function updateStatsOnLevelUp(userStats) {
  userStats.levelExperience =
    userStats.totalExperience -
    getRequiredExperienceCumulative(userStats.level);
  userStats.level++;

  if (userStats.levelExperience > getRequiredExperience(userStats.level)) {
    updateStatsOnLevelUp(userStats);
  }

  return userStats;
}

module.exports = {
  calculateExperience,
  recalculateLevels,
  levelUp,
  updateStatsOnLevelUp,
};
