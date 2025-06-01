"use strict";

const npFile = require("../commands/np.js");

function getTime(seconds = 0, minutes = 0, hours = 0) {
  return 1000 * seconds + 1000 * 60 * minutes + 1000 * 60 * 60 * hours;
}

function checkBirthdays(force = false) {
  require("../tasks/birthdays.js")
    .run(globalThis.client, force);
}

function checkFortniteShop() {
  require("../tasks/fortnite.js")
    .run(globalThis.client);
}

async function checkMinecraftServer() {
  await require("../tasks/minecraft.js")
    .run(globalThis.client, globalThis.splash);
}

function getNewSplash() {
  globalThis.splash = npFile.run([globalThis.client]);
}

module.exports = {
  checkBirthdays,
  checkFortniteShop,
  checkMinecraftServer,
  getNewSplash,
  getTime,
};