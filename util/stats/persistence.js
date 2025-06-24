"use strict";

function saveStats(stats) {
  try {
    const task = require("../../tasks/saveStats.js");
    return task.run(stats);
  } catch (err) {
    console.error("Error saving stats:", err);
  }
}

function backupStats(stats) {
  try {
    const task = require("../../tasks/backupstats.js");
    return task.run(stats);
  } catch (err) {
    console.error("Error backing up stats:", err);
  }
}

module.exports = {
  backupStats,
  saveStats
};
