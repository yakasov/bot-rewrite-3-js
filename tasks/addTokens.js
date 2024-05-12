"use strict";

const { statsConfig } = require("../resources/config.json");

exports.run = () => {
  function f() {
    // Returns UNIX time in seconds.
    return Math.floor(Date.now() / 1000);
  }

  Object.keys(globalThis.stats)
    .forEach((gk) => {
      if (f() - (globalThis.stats[gk].luckTokenTime ?? 0) > 86400) {
        Object.keys(globalThis.stats[gk])
          .filter((mk) => mk.length === 18)
          .forEach((mk) => {
            globalThis.stats[gk][mk].luckTokens =
            (globalThis.stats[gk][mk].luckTokens ?? 0) +
            statsConfig.tokenRefreshAmount;
          });

        globalThis.stats[gk].luckTokenTime = f();
      }
    });
};
