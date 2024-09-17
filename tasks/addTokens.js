"use strict";

const { getTimeInSeconds } = require("../util/common.js");
const { statsConfig } = require("../resources/config.json");

exports.run = () => {
  Object.keys(globalThis.stats)
    .forEach((guildId) => {
      if (
        getTimeInSeconds() - (globalThis.stats[guildId].luckTokenTime ?? 0) >
      86400
      ) {
        Object.keys(globalThis.stats[guildId])
          .filter((userId) => userId.length === 18)
          .forEach((userId) => {
            if (
              globalThis.stats[guildId][userId].luckTokens <
            (statsConfig.tokenMax ?? 999)
            ) {
              if (globalThis.stats[guildId][userId].luckTokens < 0) {
                globalThis.stats[guildId][userId].luckTokens = 0;
              }

              globalThis.stats[guildId][userId].luckTokens =
              (globalThis.stats[guildId][userId].luckTokens ?? 0) +
              statsConfig.tokenRefreshAmount;
            }
          });

        globalThis.stats[guildId].luckTokenTime = getTimeInSeconds();
      }
    });
};
