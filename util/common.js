"use strict";

const ranks = require("../resources/ranks.json");
const { statsConfig } = require("../resources/config.json");

function formatMessages(err, messages) {
  // Used for AI logging
  let string = `${err}\n\n`;
  messages.forEach((message) => {
    string += `Role: ${message.role}\nContent: ${message.content}\n\n`;
  });
  return string;
}

function formatTime(seconds) {
  const date = new Date(null);
  date.setSeconds(seconds);
  const unitArray = date.toISOString()
    .substr(8, 11)
    .split(/:|T/u);
  const days = parseInt(unitArray[0], 10) - 1;
  return `${days < 10 ? " " : ""}${days}d ${
    unitArray[1]
  }h ${unitArray[2]}m ${unitArray[3]}s`;
}

function getLevelName(level) {
  let nameLevel = Math.floor(level / 10) + 1;
  const highestKey = Object.keys(ranks)
    .slice(-1);
  if (nameLevel > highestKey) {
    nameLevel = highestKey;
  }
  return `${ranks[nameLevel]}\u001b[0m`;
}

function getNicknameFromInteraction(interaction, id = null, sanitize = null) {
  // Used for fetching nickname from interaction
  const member = interaction.guild.members.cache
    .filter((m) => m.id === (id ?? interaction.user.id))
    .first();
  let name = member ? member.displayName : "???";
  if (sanitize) {
    /* eslint-disable-next-line no-control-regex */
    name = name.replace(/[^\x00-\x7F]/gu, "");
  }
  return name;
}

function getNicknameFromMessage(message) {
  // Used for fetching nickname from message
  const member = message.guild.members.cache
    .filter((m) => m.id === message.author.id)
    .first();
  return `${member ? member.displayName : "???"}`;
}

function getRequiredExperience(level) {
  return level * statsConfig.xpPerLevel;
}

function getRequiredExperienceCumulative(level) {
  return (level * ((level + 1) * statsConfig.xpPerLevel)) / 2;
}

function getTimeInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function getTitle(stats) {
  if (!stats.name || stats.name.includes("undefined")) {
    const [lastName] = stats.unlockedNames.slice(-1);
    stats.name = lastName;
  }

  return stats.name;
}

module.exports = {
  formatMessages,
  formatTime,
  getLevelName,
  getNicknameFromInteraction,
  getNicknameFromMessage,
  getRequiredExperience,
  getRequiredExperienceCumulative,
  getTimeInSeconds,
  getTitle,
};
