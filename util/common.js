"use strict";

const ranks = require("../resources/ranks.json");
const { statsConfig } = require("../resources/config.json");

module.exports = {
  formatMsgs: (e, ms) => {
    // Used for AI logging
    let s = `${e}\n\n`;
    ms.forEach((m) => {
      s += `Role: ${m.role}\nContent: ${m.content}\n\n`;
    });
    return s;
  },

  formatTime: (seconds) => {

    /*
     * Note: this will only work up to 30d 23h 59m 59s
     * this is because toISOString() returns 1970-01-01T03:12:49.000Z (eg)
     * if anybody hits this, gold star - 11/02/24
     */
    const date = new Date(null);
    date.setSeconds(seconds);
    const unitArray = date.toISOString()
      .substr(8, 11)
      .split(/:|T/u);
    const days = parseInt(unitArray[0], 10) - 1;
    return `${days < 10 ? " " : ""}${days}d ${
      unitArray[1]
    }h ${unitArray[2]}m ${unitArray[3]}s`;
  },

  getLevelName: (level) => {
    let nameLevel = Math.floor(level / 10) + 1;
    const highestKey = Object.keys(ranks)
      .slice(-1);
    if (nameLevel > highestKey) {
      nameLevel = highestKey;
    }
    return `${ranks[nameLevel]}\u001b[0m`;
  },

  getNicknameInteraction: (interaction, id = null, sanitize = false) => {
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
  },

  getNicknameMsg: (msg) => {
    // Used for fetching nickname from message
    const member = msg.guild.members.cache
      .filter((m) => m.id === msg.author.id)
      .first();
    return `${member ? member.displayName : "???"}`;
  },

  getRequiredExperience: (level) => level * statsConfig.xpPerLevel,

  getRequiredExperienceCumulative: (level) =>
    (level * ((level + 1) * statsConfig.xpPerLevel)) / 2,

  getTimeInSeconds: () => Math.floor(Date.now() / 1000),

  getTitle: (stats) => {
    if (!stats.name || stats.name.includes("undefined")) {
      const [lastName] = stats.unlockedNames.slice(-1);
      console.log(lastName);
      stats.name = lastName;
    }

    return stats.name;
  }
};
