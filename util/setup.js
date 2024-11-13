"use strict";

const fs = require("fs");
const basicJsonFiles = [
  "./resources/birthdays.json",
  "./resources/chanceResponses.json",
  "./resources/insights.json",
  "./resources/luckTable.json",
  "./resources/mtg/mtgCache.json",
  "./resources/mtg/mtgCards.json",
  "./resources/stats.json",
  "./resources/ranks.json",
  "./resources/roles.json"
];

function initialSetup() {
  // Check that config.json exists
  if (!fs.existsSync("./resources/config.json")) {
    if (!fs.existsSync("./resources/config.json.template")) {
      throw Error(`
config.json does not exist, and config.json.template could not be found.

Please obtain the config.json.template from the GitHub page.`);
    }

    console.warn("config.json not found, copying from template...");
    fs.copyFile("./resources/config.json.template", "./resources/config.json");
  }

  basicJsonFiles.forEach((file) => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify({}, null, 4), (err) => {
        if (err) {
          console.error(`Could not write to file ${file}!`);
        } else {
          console.warn(`Created new base ${file}.`);
        }
      });
    }
  });
}

module.exports = { initialSetup };
