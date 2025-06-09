"use strict";

const { statsConfig } = require("../../resources/config.json");
const { getTimeInSeconds } = require("../common.js");
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
      getTimeInSeconds() - userStats.lastGainTime <
        statsConfig.messageSRGainCooldown
    ) {
      return;
    }
    userStats.lastGainTime = getTimeInSeconds();
    userStats.messages += 1;
    break;

  case "joinedVoiceChannel":
    userStats.joinTime = getTimeInSeconds();
    break;

  case "inVoiceChannel":
    if (globals.set("botUptime") < 10) {
      userStats.joinTime = getTimeInSeconds();
    }
    userStats.voiceTime += Math.floor(
      getTimeInSeconds() -
          (userStats.joinTime === 0 ? getTimeInSeconds() : userStats.joinTime)
    );
    userStats.joinTime = getTimeInSeconds();
    break;

  case "leftVoiceChannel":
    userStats.voiceTime += Math.floor(
      getTimeInSeconds() - userStats.joinTime
    );
    break;

  default:
    break;
  }

  updateScores();
  saveStats();
}

module.exports = {
  addToStats,
};
