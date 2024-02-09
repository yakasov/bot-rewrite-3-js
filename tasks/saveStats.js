const fs = require("fs");

exports.run = async (stats) => {
  const statsString = JSON.stringify(stats);

  fs.writeFileSync("./resources/stats.json", statsString);
};
