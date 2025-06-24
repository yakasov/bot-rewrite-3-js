"use strict";

const newPresenceFile = require("../commands/np.js");
const globals = require("./globals.js");

function getTime(units) {
  const { seconds = 0, minutes = 0, hours = 0 } = units;
  return 1000 * seconds + 1000 * 60 * minutes + 1000 * 60 * 60 * hours;
}

async function checkBirthdays(force = false) {
  await require("../tasks/birthdays.js")
    .run(globalThis.client, force);
}

async function checkFortniteShop() {
  await require("../tasks/fortnite.js")
    .run(globalThis.client);
}

async function checkMinecraftServer() {
  await require("../tasks/minecraft.js")
    .run(
      globalThis.client,
      globals.get("splash")
    );
}

function getNewSplash() {
  return newPresenceFile.run([globalThis.client]);
}

module.exports = {
  checkBirthdays,
  checkFortniteShop,
  checkMinecraftServer,
  getNewSplash,
  getTime,
};
