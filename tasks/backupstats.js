"use strict";

const fs = require("fs");

exports.run = () => {
  const dateString = new Date()
    .toISOString()
    .replace(/:/gu, "-");
  const backupDir = "./resources/backup";
  const backupFile = `${backupDir}/stats-${dateString}.json`;

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  fs.copyFile("./resources/stats.json", backupFile, (err) => {
    if (err) {
      console.error("Error backing up file:", err);

    }
  });
};
