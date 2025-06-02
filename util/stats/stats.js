const { getTimeInSeconds } = require("../common.js");
const { initialiseStats, saveStats, updateScores } = require("./index.js");

function addToStats(details) {
  const { type, userId, guildId, giver } = details;
  const giverId = giver ? giver.id : 0;

  if (!globalThis.stats[guildId]) {
    globalThis.stats[guildId] = {
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
        getTimeInSeconds() - globalThis.stats[guildId][userId].lastGainTime <
        statsConfig.messageSRGainCooldown
      ) {
        return;
      }
      globalThis.stats[guildId][userId].lastGainTime = getTimeInSeconds();
      globalThis.stats[guildId][userId].messages += 1;
      break;

    case "joinedVoiceChannel":
      globalThis.stats[guildId][userId].joinTime = getTimeInSeconds();
      break;

    case "inVoiceChannel":
      if (globalThis.botUptime < 10) {
        globalThis.stats[guildId][userId].joinTime = getTimeInSeconds();
      }
      globalThis.stats[guildId][userId].voiceTime += Math.floor(
        getTimeInSeconds() -
          (globalThis.stats[guildId][userId].joinTime === 0
            ? getTimeInSeconds()
            : globalThis.stats[guildId][userId].joinTime)
      );
      globalThis.stats[guildId][userId].joinTime = getTimeInSeconds();
      break;

    case "leftVoiceChannel":
      globalThis.stats[guildId][userId].voiceTime += Math.floor(
        getTimeInSeconds() - globalThis.stats[guildId][userId].joinTime
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
