"use strict";

const { getTimeInSeconds, getRanking } = require("./common.js");
const { mainGuildId, statsConfig } = require("../resources/config.json");
const { overrideUpdateScoreValue } = require("./statsModifiers.js");

module.exports = {
  "addToStats": (a) => {
    const { type, userId, guildId, messageId, giver } = a;
    const giverId = giver
      ? giver.id
      : 0;

    if (!globalThis.stats[guildId]) {
      globalThis.stats[guildId] = {
        "allowResponses": true,
        "luckTokenTime": 0,
        "rankUpChannel": ""
      };
    }

    if (!globalThis.stats[guildId].luckTokenTime) {
      // Post-casino update patch
      globalThis.stats[guildId].luckTokenTime = 0;
    }

    if (!globalThis.stats[guildId].allowResponses) {
      // Post-responses allow patch
      globalThis.stats[guildId].allowResponses = true;
    }

    module.exports.initialiseStats(guildId, userId);
    module.exports.initialiseStats(guildId, giverId);

    switch (type) {
    case "init":
      // Used for setting up initial stat values
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

    case "nerdEmojiAdded":
      if (!messageId) {
        return;
      }
      if (!giver.bot) {
        globalThis.stats[guildId][giverId].nerdsGiven++;
      }

      globalThis.stats[guildId][userId].nerdEmojis[messageId] =
          (globalThis.stats[guildId][userId].nerdEmojis[messageId] ?? 0) +
          1 +
          Math.floor(globalThis.stats[guildId][giverId].prestige / 2);
      break;

    case "nerdEmojiRemoved":
      if (!messageId) {
        return;
      }
      if (!giver.bot) {
        globalThis.stats[guildId][giverId].nerdsGiven = Math.max(
          0,
          (globalThis.stats[guildId][giverId].nerdsGiven ?? 0) - 1
        );
      }

      globalThis.stats[guildId][userId].nerdEmojis[messageId] = Math.max(
        0,
        globalThis.stats[guildId][userId].nerdEmojis[messageId] -
            (1 + Math.floor(globalThis.stats[guildId][giverId].prestige / 2))
      );
      break;

    case "coolEmojiAdded":
      if (!messageId) {
        return;
      }
      if (!giver.bot) {
        globalThis.stats[guildId][giverId].coolsGiven++;
      }

      globalThis.stats[guildId][userId].coolEmojis[messageId] =
          (globalThis.stats[guildId][userId].coolEmojis[messageId] ?? 0) +
          1 +
          Math.floor(globalThis.stats[guildId][giverId].prestige / 2);
      break;

    case "coolEmojiRemoved":
      if (!messageId) {
        return;
      }
      if (!giver.bot) {
        globalThis.stats[guildId][giverId].coolsGiven = Math.max(
          0,
          (globalThis.stats[guildId][giverId].coolsGiven ?? 0) - 1
        );
      }

      globalThis.stats[guildId][userId].coolEmojis[messageId] = Math.max(
        0,
        globalThis.stats[guildId][userId].coolEmojis[messageId] -
            (1 + Math.floor(globalThis.stats[guildId][giverId].prestige / 2))
      );
      break;

    default:
      break;
    }

    module.exports.updateScores();
    module.exports.saveStats();
  },

  "addTokens": () => {
    try {
      const task = require("../tasks/addTokens.js");
      return task.run();
    } catch (e) {
      return console.error(e);
    }
  },

  "backupStats": () => {
    try {
      const task = require("../tasks/backupstats.js");
      return task.run();
    } catch (e) {
      return console.error(e);
    }
  },

  "baseStats": {
    "bestRanking": "",
    "bestScore": 0,
    "coolEmojis": {},
    "coolHandicap": 0,
    "coolScore": 0,
    "coolsGiven": 0,
    "joinTime": 0,
    "lastDailyTime": 0,
    "lastGainTime": 0,
    "luckHandicap": 0,
    "luckTokens": 5,
    "messages": 0,
    "nerdEmojis": {},
    "nerdHandicap": 0,
    "nerdScore": 0,
    "nerdsGiven": 0,
    "prestige": 0,
    "previousMessages": 0,
    "previousVoiceTime": 0,
    "reputation": 0,
    "reputationTime": 0,
    "score": 0,
    "voiceTime": 0
  },

  "checkVoiceChannels": () => {
    const guilds = globalThis.client.guilds.cache;
    guilds.forEach((guild) => {
      const channels = guild.channels.cache.filter(
        // Voice channel is type 2
        (channel) => channel.type === 2
      );
      channels.forEach((channel) => {
        channel.members.forEach((member) => {
          module.exports.addToStats({
            "guildId": member.guild.id,
            "type": "inVoiceChannel",
            "userId": member.user.id
          });
        });
      });
    });
  },

  "initialiseStats": (guildId, userId) => {
    if (!globalThis.stats[guildId][userId]) {
      globalThis.stats[guildId][userId] = module.exports.baseStats;
      return null;
    }

    Object.entries(module.exports.baseStats)
      .forEach(([
        k,
        v
      ]) => {
        if (globalThis.stats[guildId][userId][k] === undefined) {
          globalThis.stats[guildId][userId][k] = v;
        }
      });

    Object.keys(globalThis.stats[guildId][userId])
      .forEach((k) => {
        if (module.exports.baseStats[k] === undefined) {
          delete globalThis.stats[guildId][userId][k];
        }
      });

    return null;
  },

  "prestige": (guildId, userId) => {
    globalThis.stats[guildId][userId] = module.exports.updateStatsOnPrestige(
      globalThis.stats[guildId][userId]
    );

    module.exports.sendMessage([
      guildId,
      userId,
      "Prestige",
      `Prestige ${globalThis.stats[guildId][userId].prestige}!`
    ]);
  },

  "saveInsights": () => {
    try {
      const task = require("../tasks/saveInsights.js");
      return task.run();
    } catch (e) {
      return console.error(e);
    }
  },

  "saveStats": () => {
    try {
      const task = require("../tasks/saveStats.js");
      return task.run();
    } catch (e) {
      return console.error(e);
    }
  },

  "sendMessage": async (messageArgs) => {
    const [
      guildId,
      userId,
      title,
      accolade
    ] = messageArgs;
    const guildObject = await globalThis.client.guilds.fetch(guildId);
    const userObject = guildObject.members.cache
      .filter((m) => m.id === userId)
      .first();

    // Fix for .displayName on empty user object
    if (!userObject) {
      return;
    }

    const channel = await guildObject.channels.fetch(
      globalThis.stats[guildId].rankUpChannel
    );

    /*
     * Channel can be fetched with an undefined snowflake
     * if this happens, a list of channels is returned instead.
     * Because we don't want this, we double check that rankUpChannel
     * is *actually* set, even though we already 'fetched' it.
     *
     * Prestiging / ranking up can still happen silently without
     * a rankUpChannel being explicitly set.
     */
    if (channel && globalThis.stats[guildId].rankUpChannel) {
      channel.send(
        `## ${title}!\n\`\`\`ansi\n${
          userObject.displayName
        } has reached ${accolade}!\`\`\``
      );
    }
  },

  "updateNerdCoolScores": (guildId, userId) => {
    const nerdPower =
      globalThis.stats[guildId][userId].prestige > 0
        ? 2.8
        : 1.8;
    globalThis.stats[guildId][userId].nerdScore =
      Object.values(globalThis.stats[guildId][userId].nerdEmojis)
        .reduce(
          (sum, a) => sum + Math.max(nerdPower ** a + 1, 0) - 1,
          0
        ) - globalThis.stats[guildId][userId].nerdHandicap;

    globalThis.stats[guildId][userId].coolScore =
      Object.values(globalThis.stats[guildId][userId].coolEmojis)
        .reduce(
          (sum, a) => sum + Math.max(2.8 ** a + 1, 0) - 1,
          0
        ) - globalThis.stats[guildId][userId].coolHandicap;
  },

  "updateScoreValue": (guildId, userId) => {
    const score = Math.floor(
      (globalThis.stats[guildId][userId].voiceTime *
        statsConfig.voiceChatSRGain +
        globalThis.stats[guildId][userId].messages *
          statsConfig.messageSRGain) *
        Math.max(
          1 +
            globalThis.stats[guildId][userId].reputation *
              statsConfig.reputationGain,
          0.01
        ) *
        1.2 ** globalThis.stats[guildId][userId].prestige +
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

  "updateScores": () => {
    Object.entries(globalThis.stats)
      .forEach(([
        guildId,
        guildStats
      ]) => {
        Object.keys(guildStats)
          .filter((k) => k.length === 18)
          .forEach((userId) => {
            module.exports.addToStats({
              guildId,
              "type": "init",
              userId
            });

            if (globalThis.stats[guildId][userId].reputation > 99) {
              globalThis.stats[guildId][userId].reputation = -99;
            } else if (globalThis.stats[guildId][userId].reputation < -99) {
              globalThis.stats[guildId][userId].reputation = 99;
            }

            module.exports.updateNerdCoolScores(guildId, userId);
            if (guildId === mainGuildId) {
              overrideUpdateScoreValue(guildId, userId);
            } else {
              module.exports.updateScoreValue(guildId, userId);
            }

            if (
              globalThis.stats[guildId][userId].score >=
            statsConfig.prestigeRequirement
            ) {
              module.exports.prestige(guildId, userId);
            } else if (
              globalThis.stats[guildId][userId].score >
            globalThis.stats[guildId][userId].bestScore
            ) {
              globalThis.stats[guildId][userId].bestScore =
              globalThis.stats[guildId][userId].score;

              if (
                globalThis.stats[guildId][userId].bestRanking !==
                getRanking(globalThis.stats[guildId][userId].score) &&
              globalThis.stats[guildId].rankUpChannel &&
              globalThis.botUptime > 120
              ) {
                module.exports.sendMessage([
                  guildId,
                  userId,
                  "Rank Up!",
                  getRanking(globalThis.stats[guildId][userId].score)
                ]);
              }
              globalThis.stats[guildId][userId].bestRanking = getRanking(
                globalThis.stats[guildId][userId].score
              );
            }
          });
      });
  },

  "updateStatsOnPrestige": (userStats) => {
    userStats.prestige++;
    userStats.bestRanking = "";
    userStats.bestScore = 0;
    // Potential fix for weird adjustment post-prestige
    userStats.score = 0;

    // Store message + voiceTime values then reset them
    userStats.previousMessages += userStats.messages;
    userStats.previousVoiceTime += userStats.voiceTime;

    // Add nerdHandicap to offset nerdScore
    userStats.nerdHandicap = Math.max(userStats.nerdScore, 0) * 0.8;

    // Do the same with coolHandicap
    userStats.coolHandicap = Math.max(userStats.coolScore, 0) * 0.8;

    // Cap max saved handicap at 10K
    userStats.luckHandicap = Math.min(userStats.luckHandicap, 10000);

    userStats.messages = 0;
    userStats.voiceTime = 0;

    return userStats;
  }
};
