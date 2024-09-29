"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { generateTable } = require("../util/tableGenerator.js");
const {
  formatTime,
  getNicknameInteraction,
  getRequiredExperience,
  getLevelName,
  getTitle
} = require("../util/common.js");

module.exports = {
  "data": new SlashCommandBuilder()
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
        interaction.guild.members.cache.filter((m) => m.id === k)
          .first());

    const topNerder = filterStats
      .map(([
        k,
        v
      ]) => [
        k,
        v.nerdsGiven
      ])
      .sort(([, f], [, s]) => s - f)[0];

    const topNerded = filterStats
      .map(([
        k,
        v
      ]) => [
        k,
        Object.values(v.nerdEmojis)
          .reduce((sum, count) => sum + count, 0)
      ])
      .sort(([, f], [, s]) => s - f)[0];

    const topScores = filterStats
      .map(([
        k,
        v
      ]) => [
        k,
        v.totalExperience
      ])
      .sort(([, f], [, s]) => s - f);

    const reputations = filterStats.map(([
      k,
      v
    ]) => [
      k,
      v.reputation
    ]);

    const topReputation = [...reputations].sort(([, f], [, s]) => s - f)[0];
    const bottomReputation = [...reputations].sort(([, f], [, s]) => f - s)[0];

    let outputMessage = `Top nerder: ${getNicknameInteraction(
      interaction,
      topNerder[0]
    )} (${topNerder[1]} emojis given)\nMost nerded: ${getNicknameInteraction(
      interaction,
      topNerded[0]
    )} (${
      topNerded[1]
    } emojis received)\nHighest reputation: ${getNicknameInteraction(
      interaction,
      topReputation[0]
    )} (${
      topReputation[1]
    } reputation)\nLowest reputation: ${getNicknameInteraction(
      interaction,
      bottomReputation[0]
    )} (${bottomReputation[1]} reputation)\n\n`;

    const data = [];

    /* eslint-disable sort-keys*/
    topScores.slice(0, 10, topScores.length)
      .forEach((a, i) => {
        data.push({
          "#": i + 1,
          "Name": getNicknameInteraction(interaction, a[0], true),
          "Level": `${guildStats[a[0]].level} (${
            guildStats[a[0]].levelExperience
          }/${
            getRequiredExperience(guildStats[a[0]].level)
          } XP)`,
          "Msgs": guildStats[a[0]].messages,
          "Time": formatTime(
            guildStats[a[0]].voiceTime
          ),
          "Title": getTitle(guildStats[a[0]]),
          "Rep": module.exports.formatReputation(
            module.exports.addLeadingZero(guildStats[a[0]].reputation)
          )
        });
      });
    /* eslint-enable sort-keys*/

    outputMessage += generateTable(data);

    const userRanking = topScores
      .map(([
        k,
        v
      ], i) => [
        k,
        v,
        i
      ])
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
  "addLeadingZero": (num) => {
    if (num > -10 && num < 10) {
      return num >= 0
        ? `0${num}`
        : `-0${Math.abs(num)}`;
    }
    return num;
  },
  "formatReputation": (rep) =>
    `${module.exports.getColorCode(rep)}${rep}\u001b[0m`,
  "getColorCode": (rep) => {
    if (rep > 0) {
      return "\u001b[1;32m";
    }
    if (rep < 0) {
      return "\u001b[1;31m";
    }
    return "\u001b[1;00m";
  }
};
