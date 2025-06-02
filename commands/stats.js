"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { generateTable } = require("../util/tableGenerator.js");
const {
  formatTime,
  getNicknameInteraction,
  getRequiredExperience,
  getLevelName,
  getTitle,
} = require("../util/common.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show server statistics"),
  execute(interaction) {
    const guildStats = globalThis.stats[interaction.guild.id];
    if (!guildStats) {
      return interaction.reply("This server has no statistics yet!");
    }

    const filterStats = Object.entries(guildStats)
      .filter(([k]) => k.length === 18)
      .filter(([k]) =>
        interaction.guild.members.cache.filter((m) => m.id === k).first()
      );

    const topScores = filterStats
      .map(([k, v]) => [k, v.totalExperience])
      .sort(([, f], [, s]) => s - f);

    let outputMessage = "";

    const data = [];

    /* eslint-disable sort-keys*/
    topScores.slice(0, 10, topScores.length).forEach((a, i) => {
      data.push({
        "#": i + 1,
        Name: getNicknameInteraction(interaction, a[0], true),
        Level: `${guildStats[a[0]].level} (${
          guildStats[a[0]].levelExperience
        }/${getRequiredExperience(guildStats[a[0]].level)} XP)`,
        Msgs: guildStats[a[0]].messages,
        "Voice Time": formatTime(guildStats[a[0]].voiceTime),
        Title: getTitle(guildStats[a[0]]),
      });
    });
    /* eslint-enable sort-keys*/

    outputMessage += generateTable(data);

    const userRanking = topScores
      .map(([k, v], i) => [k, v, i])
      .find(([k]) => k === interaction.user.id);
    if (userRanking) {
      outputMessage += `\nYour ranking (${getNicknameInteraction(
        interaction,
        userRanking[0]
      )}): #${userRanking[2] + 1} (${getLevelName(
        guildStats[userRanking[0]].level
      )}, ${guildStats[userRanking[0]].totalExperience} XP)`;
    }

    return interaction.reply(`\`\`\`ansi\n${outputMessage}\n\`\`\``);
  },
  /* eslint-disable sort-keys */
  addLeadingZero: (num) => {
    if (num > -10 && num < 10) {
      return num >= 0 ? `0${num}` : `-0${Math.abs(num)}`;
    }
    return num;
  },
};
