"use strict";

const { statsConfig } = require("../../resources/config.json");
const {
  getRequiredExperience,
  getRequiredExperienceCumulative,
  getLevelName,
} = require("../common.js");
const { sendMessage } = require("./messages.js");
const { DISCORD_ID_LENGTH } = require("../consts.js");
const globals = require("../globals.js");

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
}

function levelUp(guildId, userId) {
  const userStats = globals.get("stats")[guildId][userId];
  updateStatsOnLevelUp(userStats);

  if (userStats.level % 10 === 0) {
    sendMessage([
      guildId,
      userId,
      "Level Up",
      `level ${userStats.level}`,
      getLevelName(userStats.level),
    ]);
  }
}

function recalculateLevels() {
  const stats = globals.get("stats");
  for (const [guildId, guildStats] of Object.entries(stats)) {
    const userIds = Object.keys(guildStats)
      .filter(
        (id) => id.length === DISCORD_ID_LENGTH
      );
    for (const userId of userIds) {
      const userStats = stats[guildId][userId];
      userStats.level = 0;
      userStats.levelExperience = 0;
      userStats.totalExperience = 0;
      calculateExperience(userStats);

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
}

module.exports = {
  calculateExperience,
  levelUp,
  recalculateLevels,
  updateStatsOnLevelUp,
};
