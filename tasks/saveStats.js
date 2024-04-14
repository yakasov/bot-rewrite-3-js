"use strict";

const fs = require("fs");

exports.run = (stats) => {
  fs.writeFileSync("./resources/stats.json", JSON.stringify(stats));
};
