"use strict";

const fs = require("fs");
const globals = require("../util/globals");

exports.run = () => {
  fs.writeFileSync(
    "./resources/stats.json",
    JSON.stringify(globals.get("stats"))
  );
};
