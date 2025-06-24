"use strict";

const { statsConfig } = require("../../resources/config.json");
const { getDateNowInSeconds } = require("../common.js");
const { DISCORD_ID_LENGTH } = require("../consts.js");
const globals = require("../globals.js");
const { initialiseStats } = require("./baseStats.js");
const { saveStats } = require("./persistence.js");
const { updateScores } = require("./score.js");

function addToStats(details) {
  const { type, userId, guildId, giver } = details;
  const giverId = giver ? giver.id : 0;
  const stats = globals.get("stats");
  const guildStats = stats[guildId];
  const userStats = guildStats[userId];

  if (!guildStats) {
    stats[guildId] = {
      allowResponses: true,
      rankUpChannel: "",
    };
  }

  initialiseStats(guildId, userId);
  initialiseStats(guildId, giverId);

  switch (type) {
  case "init":
    return;
  case "message":
    if (
      getDateNowInSeconds() - userStats.lastGainTime <
        statsConfig.messageSRGainCooldown
    ) {
      return;
    }
    userStats.lastGainTime = getDateNowInSeconds();
    userStats.messages += 1;
    break;

  case "joinedVoiceChannel":
    userStats.joinTime = getDateNowInSeconds();
    break;

  case "inVoiceChannel":
    if (globals.set("botUptime") < 10) {
      userStats.joinTime = getDateNowInSeconds();
    }
    userStats.voiceTime += Math.floor(
      getDateNowInSeconds() -
          (userStats.joinTime === 0 ? getDateNowInSeconds() : userStats.joinTime)
    );
    userStats.joinTime = getDateNowInSeconds();
    break;

  case "leftVoiceChannel":
    userStats.voiceTime += Math.floor(
      getDateNowInSeconds() - userStats.joinTime
    );
    break;

  default:
    break;
  }

  updateScores();
  saveStats();
}

function orderStatsByRank(guildStats, guild) {
  /*
   * This is a complicated chain
   * Essentially, find all user stats by matching keys to DISCORD_ID_LENGTH,
   * map those stats to be [id, totalExperience],
   * order all those stats using totalExperience,
   * and then map the ordered stats to [id, totalExperience, rankPosition].
   *
   * After, find the entry matching the user ID and return it.
   *
   * TODO: There is _definitely_ a better way to do this.
   */
  return Object.entries(guildStats)
    .filter(
      ([key]) => key.length === DISCORD_ID_LENGTH && guild.members.cache.has(key)
    )
    .map(([key, stats]) => [key, stats.totalExperience])
    .sort(([, first], [, second]) => second - first);
}

module.exports = {
  addToStats,
  orderStatsByRank,
};
