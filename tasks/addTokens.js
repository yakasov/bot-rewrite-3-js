"use strict";

const fs = require("fs");
const { setTimeout } = require("timers/promises");

exports.run = async (stats) => {
  function f() {
    // Returns UNIX time in seconds.
    return Math.floor(Date.now() / 1000);
  }

  function getTime(seconds = 0, minutes = 0, hours = 0) {
    return 1000 * seconds + 1000 * 60 * minutes + 1000 * 60 * 60 * hours;
  }

  Object.keys(stats)
    .forEach((gk) => {
      if (f() - stats[gk].lastTokenTime < getTime(0, 0, 24)) {
        Object.keys(stats[gk])
          .filter((mk) => mk.length === 18)
          .forEach((mk) => {
            stats[gk][mk].tokens = (stats[gk][mk].tokens ?? 0) + 3;
          });

        stats[gk].lastTokenTime = f();
      }
    });

  try {
    fs.writeFileSync("./resources/stats.json", JSON.stringify(stats));
  } catch {

    /*
     * Hacky fix for stats.json deadlock
     * Should probably change to streams...
     */
    await setTimeout(1500);
    fs.writeFileSync("./resources/stats.json", JSON.stringify(stats));
  }
};
