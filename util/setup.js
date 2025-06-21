"use strict";

const fs = require("fs");
const { BASIC_JSON_FILES } = require("./consts");

function initialSetup() {
  // Check that config.json exists
  if (!fs.existsSync("./resources/config.json")) {
    if (!fs.existsSync("./resources/config.json.template")) {
      throw Error(`
config.json does not exist, and config.json.template could not be found.

Please obtain the config.json.template from the GitHub page.`);
    }

    console.warn("config.json not found, copying from template...");
    fs.copyFile("./resources/config.json.template", "./resources/config.json", (err) => console.error(err));
  }

  if (!fs.existsSync("./resources/mtg")) {
    fs.mkdirSync("./resources/mtg");
  }

  if (!fs.existsSync("./resources/mtg/images")) {
    fs.mkdirSync("./resources/mtg/images");
  }

  BASIC_JSON_FILES.forEach((file) => {
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

initialSetup();
