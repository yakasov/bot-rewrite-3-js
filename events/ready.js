"use strict";

const {
  checkBirthdays,
  checkFortniteShop,
  checkMinecraftServer,
  getNewSplash,
  getTime
} = require("../util/scheduledTasks.js");
const { checkVoiceChannels } = require("../util/stats.js");
const { backupStats, saveStats, updateScores } = require("../util/stats.js");

module.exports = function handleClientReady(c) {
  console.log(
    "Connected and ready to go!\n" +
      `Current date is ${globalThis.currentDate}, ` +
      `logged in as ${c.user.tag}\n`
  );

  checkVoiceChannels();
  checkBirthdays(true);
  checkMinecraftServer();
  getNewSplash();
  backupStats();

  /* eslint-disable line-comment-position */
  setInterval(() => {
    globalThis.botUptime += 10;
  }, getTime(10));
  setInterval(checkBirthdays, getTime(0, 15)); // 15 minutes
  setInterval(checkFortniteShop, getTime(0, 15)); // 15 minutes
  setInterval(checkMinecraftServer, getTime(5)); // 5 seconds
  setInterval(getNewSplash, getTime(0, 0, 1)); // 1 hour
  setInterval(checkVoiceChannels, getTime(15)); // 15 seconds
  setInterval(saveStats, getTime(0, 3)); // 3 minutes
  setInterval(backupStats, getTime(0, 15)); // 15 minutes
  setInterval(updateScores, getTime(30)); // 30 seconds
  /* eslint-enable line-comment-position */
};
