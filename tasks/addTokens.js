"use strict";

exports.run = () => {
  function f() {
    // Returns UNIX time in seconds.
    return Math.floor(Date.now() / 1000);
  }

  function getTime(seconds = 0, minutes = 0, hours = 0) {
    return 1000 * seconds + 1000 * 60 * minutes + 1000 * 60 * 60 * hours;
  }

  Object.keys(globalThis.stats)
    .forEach((gk) => {
      if (f() - globalThis.stats[gk].lastTokenTime < getTime(0, 0, 24)) {
        Object.keys(globalThis.stats[gk])
          .filter((mk) => mk.length === 18)
          .forEach((mk) => {
            globalThis.stats[gk][mk].tokens =
              (globalThis.stats[gk][mk].tokens ?? 0) + 3;
          });

        globalThis.stats[gk].lastTokenTime = f();
      }
    });
};
