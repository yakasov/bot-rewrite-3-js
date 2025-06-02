function saveStats(stats) {
  try {
    const task = require("../../tasks/saveStats.js");
    return task.run(stats);
  } catch (e) {
    console.error("Error saving stats:", e);
  }
}

function backupStats(stats) {
  try {
    const task = require("../../tasks/backupstats.js");
    return task.run(stats);
  } catch (e) {
    console.error("Error backing up stats:", e);
  }
}

module.exports = {
  saveStats,
  backupStats,
};
