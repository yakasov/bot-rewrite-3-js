"use strict";

const chanceResponses = require("../resources/chanceResponses.json");

function generateRollTable() {
  let totalChance = 0;
  let cumChance = 0;
  let tempRollTable = [];
  const rollTable = [];

  chanceResponses.forEach((response) => {
    totalChance += response.chance;
    tempRollTable.push(response);
  });

  const multiplier = 100 / totalChance;

  tempRollTable = tempRollTable.map((response) => ({
    ...response,
    "chance": response.chance * multiplier
  }));

  tempRollTable.forEach((response) => {
    rollTable.push({
      ...response,
      "chance": response.chance + cumChance
    });

    cumChance += response.chance;
  });

  return rollTable;
}

module.exports = { generateRollTable };
