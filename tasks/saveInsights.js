"use strict";

const fs = require("fs");

exports.run = () => {
  fs.writeFileSync(
    "./resources/insights.json", 
    JSON.stringify(globalThis.insights)
  );
};
