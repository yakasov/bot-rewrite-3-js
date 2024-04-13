"use strict";

const fs = require("fs");

exports.run = async (stats) => {
  fs.writeFileSync("./resources/stats.json", JSON.stringify(stats));
};
