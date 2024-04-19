"use strict";

const fs = require("fs");

exports.run = () => {
  fs.writeFileSync("./resources/stats.json", JSON.stringify(globalThis.stats));
};
