"use strict";

const { getTimeInSeconds } = require("common.js");
const { statsConfig } = require("../resources/config.json");
const { ranks } = require("../resources/ranks.json");

module.exports = {
  addToStats: (a) => {
    const { type, userId, guildId, messageId, giver } = a;
    const giverId = giver ? giver.id : 0;

    if (!globalThis.stats[guildId]) {
      globalThis.stats[guildId] = {
        allowResponses: true,
        luckTokenTime: 0,
        rankUpChannel: "",
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

  addTokens: () => {
    try {
      const task = require("./tasks/addTokens.js");
      return task.run();
    } catch (e) {
      return console.error(e);
    }
  },

  backupStats: () => {
    try {
      const task = require("./tasks/backupstats.js");
      return task.run();
    } catch (e) {
      return console.error(e);
    }
  },

  checkVoiceChannels: () => {
    // This function should ALSO really be a separate task!!!
    const guilds = client.guilds.cache;
    guilds.forEach((guild) => {
      const channels = guild.channels.cache.filter(
        // Voice channel is type 2
        (channel) => channel.type === 2
      );
      channels.forEach((channel) => {
        channel.members.forEach((member) => {
          module.exports.addToStats({
            guildId: member.guild.id,
            type: "inVoiceChannel",
            userId: member.user.id,
          });
        });
      });
    });
  },

  getRanking: (score) => {
    let rankString = "MISSINGNO";
    Object.entries(ranks)
      .forEach(([k, v]) => {
        if (v[0] <= score) {
          rankString = `${v[1]}${k}\u001b[0m`;
        }
      });
    return rankString;
  },

  initialiseStats: (guildId, userId) => {
    const baseObj = {
      bestRanking: "",
      bestScore: 0,
      coolEmojis: {},
      coolHandicap: 0,
      coolScore: 0,
      coolsGiven: 0,
      joinTime: 0,
      lastGainTime: 0,
      luckHandicap: 0,
      luckTokens: 5,
      messages: 0,
      nerdEmojis: {},
      nerdHandicap: 0,
      nerdScore: 0,
      nerdsGiven: 0,
      prestige: 0,
      previousMessages: 0,
      previousVoiceTime: 0,
      reputation: 0,
      reputationTime: 0,
      score: 0,
      voiceTime: 0,
    };

    if (!globalThis.stats[guildId][userId]) {
      globalThis.stats[guildId][userId] = baseObj;
      return null;
    }

    Object.entries(baseObj)
      .forEach(([k, v]) => {
        if (globalThis.stats[guildId][userId][k] === undefined) {
          globalThis.stats[guildId][userId][k] = v;
        }
      });

    Object.keys(globalThis.stats[guildId][userId])
      .forEach((k) => {
        if (baseObj[k] === undefined) {
          delete globalThis.stats[guildId][userId][k];
        }
      });

    return null;
  },

  saveInsights: () => {
    try {
      const task = require("./tasks/saveInsights.js");
      return task.run();
    } catch (e) {
      return console.error(e);
    }
  },

  saveStats: () => {
    try {
      const task = require("./tasks/saveStats.js");
      return task.run();
    } catch (e) {
      return console.error(e);
    }
  },

  updateScores: () => {
    Object.entries(globalThis.stats)
      .forEach(([guild, guildStats]) => {
        Object.keys(guildStats)
          .filter((k) => k.length === 18)
          .forEach(async (user) => {
            module.exports.addToStats({
              guildId: guild,
              type: "init",
              userId: user,
            });

            if (globalThis.stats[guild][user].reputation > 99) {
              globalThis.stats[guild][user].reputation = -99;
            } else if (globalThis.stats[guild][user].reputation < -99) {
              globalThis.stats[guild][user].reputation = 99;
            }

            const nerdPower =
            globalThis.stats[guild][user].prestige > 0 ? 2.8 : 1.8;
            globalThis.stats[guild][user].nerdScore =
            Object.values(globalThis.stats[guild][user].nerdEmojis)
              .reduce(
                (sum, a) => sum + Math.max(nerdPower ** a + 1, 0) - 1,
                0
              ) - globalThis.stats[guild][user].nerdHandicap;

            globalThis.stats[guild][user].coolScore =
            Object.values(globalThis.stats[guild][user].coolEmojis)
              .reduce(
                (sum, a) => sum + Math.max(2.8 ** a + 1, 0) - 1,
                0
              ) - globalThis.stats[guild][user].coolHandicap;

            const score = Math.floor(
              (globalThis.stats[guild][user].voiceTime *
              statsConfig.voiceChatSRGain +
              globalThis.stats[guild][user].messages *
                statsConfig.messageSRGain) *
              Math.max(
                1 +
                  globalThis.stats[guild][user].reputation *
                    statsConfig.reputationGain,
                0.01
              ) *
              1.2 ** globalThis.stats[guild][user].prestige +
              globalThis.stats[guild][user].luckHandicap +
              globalThis.stats[guild][user].coolScore -
              globalThis.stats[guild][user].nerdScore
            );

            if (
              score > statsConfig.prestigeRequirement &&
            globalThis.stats[guild][user].prestige < statsConfig.prestigeMaximum
            ) {
              globalThis.stats[guild][user].score =
              statsConfig.prestigeRequirement;
            } else {
              globalThis.stats[guild][user].score = score;
            }

            if (
              globalThis.stats[guild][user].score >
            globalThis.stats[guild][user].bestScore
            ) {
              globalThis.stats[guild][user].bestScore =
              globalThis.stats[guild][user].score;

              if (
                globalThis.stats[guild][user].bestRanking !==
                module.exports.getRanking(
                  globalThis.stats[guild][user].score
                ) &&
              globalThis.stats[guild].rankUpChannel &&
              globalThis.botUptime > 120
              ) {
                const guildObject = await client.guilds.fetch(guild);
                const userObject = guildObject.members.cache
                  .filter((m) => m.id === user)
                  .first();

                // Fix for .displayName on empty user object
                if (!userObject) {
                  return;
                }

                const channel = await guildObject.channels.fetch(
                  globalThis.stats[guild].rankUpChannel
                );

                if (channel) {
                  channel.send(
                    `## Rank Up!\n\`\`\`ansi\n${
                      userObject.displayName
                    } has reached rank ${module.exports.getRanking(
                      globalThis.stats[guild][user].score
                    )}!\`\`\``
                  );
                }
              }
              globalThis.stats[guild][user].bestRanking =
              module.exports.getRanking(globalThis.stats[guild][user].score);
            }
          });
      });
  },
};
