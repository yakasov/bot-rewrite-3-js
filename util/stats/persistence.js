/* eslint-disable no-else-return */
"use strict";

const { statsConfig } = require("../../resources/config.json");

function saveStats(stats) {
  try {
    if (statsConfig.useDatabase) {
      const dbFunctions = require("./dbFunctions.js");
      return dbFunctions.saveStatsToDatabase(stats);
    } else {
      const task = require("../../tasks/saveStats.js");
      return task.run(stats);
    }
  } catch (err) {
    console.error("Error saving stats:", err);
  }
}

function backupStats(stats) {
  try {
    if (statsConfig.useDatabase) {
      const dbFunctions = require("./dbFunctions.js");
      return dbFunctions.backupStatsFromDatabase(stats);
    } else {
      const task = require("../../tasks/backupstats.js");
      return task.run(stats);
    }
  } catch (err) {
    console.error("Error backing up stats:", err);
  }
}

async function loadStats() {
  try {
    if (statsConfig.useDatabase) {
      const dbFunctions = require("./dbFunctions.js");
      await dbFunctions.createTables();
      return await dbFunctions.loadStatsFromDatabase();
    } else {
      // Load from file if not using database
      try {
        return require("../../resources/stats.json");
      } catch (err) {
        console.log("No stats.json found, starting with empty stats");
        return {};
      }
    }
  } catch (err) {
    console.error("Error loading stats:", err);
    return {};
  }
}

module.exports = {
  backupStats,
  saveStats,
  loadStats
};
