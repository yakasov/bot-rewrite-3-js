"use strict";

const {
  checkBirthdays,
  checkFortniteShop,
  checkMinecraftServer,
  getNewSplash,
  getTime
} = require("../util/scheduledTasks.js");
const {
  backupStats,
  checkVoiceChannels,
  saveStats,
  updateScores
} = require("../util/stats");

async function handleClientReady(c) {
  console.log(
    "Connected and ready to go!\n" +
      `Current date is ${globalThis.currentDate}, ` +
      `logged in as ${c.user.tag}\n`
  );

  checkVoiceChannels();
  await checkBirthdays(true);
  await checkMinecraftServer();
  // eslint-disable-next-line require-atomic-updates
  globalThis.splash = getNewSplash();
  backupStats();

  /* eslint-disable line-comment-position */
  setInterval(() => {
    globalThis.botUptime += 10;
  }, getTime(10));
  setInterval(checkBirthdays, getTime(0, 15)); // 15 minutes
  setInterval(checkFortniteShop, getTime(0, 15)); // 15 minutes
  setInterval(checkMinecraftServer, getTime(5)); // 5 seconds
  setInterval(
    () => {
      globalThis.splash = getNewSplash;
    },
    getTime(0, 30)
  ); // 30 minutes
  setInterval(checkVoiceChannels, getTime(15)); // 15 seconds
  setInterval(saveStats, getTime(0, 3)); // 3 minutes
  setInterval(backupStats, getTime(0, 15)); // 15 minutes
  setInterval(updateScores, getTime(30)); // 30 seconds
  /* eslint-enable line-comment-position */
}

module.exports = { handleClientReady };
