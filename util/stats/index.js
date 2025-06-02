"use strict";

const baseStats = require("./baseStats");
const experience = require("./experience");
const messages = require("./messages");
const persistence = require("./persistence");
const score = require("./score");
const stats = require("./stats");
const voice = require("./voice");

module.exports = {
  ...baseStats,
  ...experience,
  ...messages,
  ...persistence,
  ...score,
  ...stats,
  ...voice,
};
