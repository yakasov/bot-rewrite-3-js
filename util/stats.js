"use strict";

const {
  getLevelName,
  getTimeInSeconds,
  getRequiredExperience,
  getRequiredExperienceCumulative
} = require("./common.js");
const { generateCharm } = require("../commands/charms.js");
const { statsConfig } = require("../resources/config.json");
const ranks = require("../resources/ranks.json");

module.exports = {
  "addToStats": (a) => {
    const { type, userId, guildId, giver } = a;
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
    "achievementTracking": {},
    "achievements": [],
    "charms": [],
    "charmsRolled": false,
    "customSetName": false,
    "joinTime": 0,
    "lastDailyTime": 0,
    "lastGainTime": 0,
    "level": 0,
    "levelExperience": 0,
    "luckHandicap": 0,
    "luckTokens": 10,
    "messages": 0,
    "name": "",
    "previousMessages": 0,
    "previousVoiceTime": 0,
    "totalExperience": 0,
    "unlockedNames": [],
    "voiceTime": 0
  },

  "calculateExperience": (s) => {
    const { charms } = s;
    const exp = Math.floor(
      ((s.voiceTime *
        (1 + module.exports.checkCharmEffect("voice_mult", charms)) *
        (statsConfig.voiceChatSRGain +
          module.exports.checkCharmEffect("voice_bonus", charms) *
            statsConfig.voiceChatSRGain) +
        s.messages *
          (1 + module.exports.checkCharmEffect("msg_mult", charms)) *
          (statsConfig.messageSRGain +
            module.exports.checkCharmEffect("msg_bonus", charms) *
              statsConfig.messageSRGain)) +
        s.luckHandicap) *
        (1 + module.exports.checkCharmEffect("xp_mult", charms) / 2)
    );

    s.levelExperience = Math.max(
      exp - getRequiredExperienceCumulative(s.level - 1),
      0
    );
    s.totalExperience = Math.max(exp, s.totalExperience);

    return s;
  },

  "checkCharmEffect": (charmName, charms) => {
    const matchingCharms = charms.filter((c) => c.effect === charmName);
    let bonus = 0;

    for (const charm of matchingCharms) {
      bonus += charm.rarity / 100;
    }

    return bonus;
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

    if (!globalThis.stats[guildId][userId].charmsRolled && globalThis.stats[guildId][userId].charms.length === 0) {
      for (let _ = 0; _ < 3; _++) {
        globalThis.stats[guildId][userId].charms.push(generateCharm(40));
      }
    }

    return null;
  },

  "levelUp": (guildId, userId) => {
    globalThis.stats[guildId][userId] = module.exports.updateStatsOnLevelUp(
      globalThis.stats[guildId][userId]
    );

    if (globalThis.stats[guildId][userId].level % 10 === 0) {
      module.exports.sendMessage([
        guildId,
        userId,
        "Level Up",
        `level ${globalThis.stats[guildId][userId].level}!`
      ]);
    }
  },

  "recalculateLevels": () => {
    Object.entries(globalThis.stats)
      .forEach(([
        guildId,
        guildStats
      ]) => {
        Object.keys(guildStats)
          .filter((k) => k.length === 18)
          .forEach((userId) => {
            let s = globalThis.stats[guildId][userId];
            s.level = 0;
            s.levelExperience = 0;
            s.totalExperience = 0;
            s = module.exports.calculateExperience(globalThis.stats[guildId][userId]);

            while (s.totalExperience > getRequiredExperienceCumulative(s.level)) {
              s.level++;
            }

            if (!s.customSetName) {
              s.name = getLevelName(s.level);
            }
          });
      });
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

    /*
     * (Temporary) fix for multiple prestige messages where one breaks
     * I'm not sure why this happens just yet
     */
    if (accolade === "MISSINGNO") {
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
        `## ${title}!\n\`\`\`ansi\n${userObject.displayName} has reached ${accolade}\`\`\``
      );
    }
  },

  "updateScoreValue": (guildId, userId) => {
    const s = module.exports.calculateExperience(globalThis.stats[guildId][userId]);

    for (let i = 0; i < Math.floor(s.level / 10); i++) {
      const str = `${i + 1}`;
      if (!s.unlockedNames.includes(`${ranks[str]}\u001b[0m`)) {
        s.unlockedNames.push(`${ranks[str]}\u001b[0m`);
      }
    }

    // Fix for duplicates in unlockedNames
    s.unlockedNames = [...new Set(s.unlockedNames)];

    if (!s.customSetName) {
      s.name = getLevelName(s.level);
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

            module.exports.updateScoreValue(guildId, userId);

            if (
              globalThis.stats[guildId][userId].totalExperience >=
            getRequiredExperienceCumulative(
              globalThis.stats[guildId][userId].level
            )
            ) {
              module.exports.levelUp(guildId, userId);
            }
          });
      });
  },

  "updateStatsOnLevelUp": (userStats) => {
    userStats.levelExperience =
      userStats.totalExperience -
      getRequiredExperienceCumulative(userStats.level);
    userStats.level++;

    if (userStats.levelExperience > getRequiredExperience(userStats.level)) {
      module.exports.updateStatsOnLevelUp(userStats);
    }

    return userStats;
  }
};
