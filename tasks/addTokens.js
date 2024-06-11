"use strict";

const { getTimeInSeconds } = require("../util/common.js");
const { statsConfig } = require("../resources/config.json");

exports.run = () => {
  Object.keys(globalThis.stats)
    .forEach((gk) => {
      if (getTimeInSeconds() - (globalThis.stats[gk].luckTokenTime ?? 0) > 86400) {
        Object.keys(globalThis.stats[gk])
          .filter((mk) => mk.length === 18)
          .forEach((mk) => {
            globalThis.stats[gk][mk].luckTokens =
            (globalThis.stats[gk][mk].luckTokens ?? 0) +
            statsConfig.tokenRefreshAmount;
          });

        globalThis.stats[gk].luckTokenTime = getTimeInSeconds();
      }
    });
};
