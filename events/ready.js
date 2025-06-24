"use strict";

const globals = require("../util/globals.js");
const {
  checkBirthdays,
  checkFortniteShop,
  checkMinecraftServer,
  getNewSplash,
  getTime,
} = require("../util/scheduledTasks.js");
const {
  backupStats,
  checkVoiceChannels,
  saveStats,
  updateScores,
} = require("../util/stats");

async function handleClientReady(c) {
  console.log(
    `Current date and time is ${globals.get("currentDate")}, ` +
      `logged in as ${c.user.tag}\n` +
      "Connected and ready to go!\n"
  );

  checkVoiceChannels();
  await checkBirthdays(true);
  await checkMinecraftServer();
  // eslint-disable-next-line require-atomic-updates
  globals.set("splash", getNewSplash());
  backupStats();

  setInterval(
    () => {
      globals.set("botUptime", globals.get("botUptime") + 10);
    },
    getTime({ seconds: 10 }) 
  );
  setInterval(checkBirthdays, getTime({ minutes: 15 }));
  setInterval(checkFortniteShop, getTime({ minutes: 15 }));
  setInterval(checkMinecraftServer, getTime({ seconds: 5 })); 
  setInterval(
    () => {
      globals.set("splash", getNewSplash());
    },
    getTime({ minutes: 30 })
  );
  setInterval(checkVoiceChannels, getTime({ seconds: 15 }));
  setInterval(saveStats, getTime({ minutes: 3 })); 
  setInterval(backupStats, getTime({ minutes: 15 })); 
  setInterval(updateScores, getTime({ seconds: 30 }));
}

module.exports = { handleClientReady };
