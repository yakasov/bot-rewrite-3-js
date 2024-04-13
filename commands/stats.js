"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { generateTable } = require("./../resources/tableGenerator.js");
const stats = require("./../resources/stats.json");
const ranks = require("./../resources/ranks.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show server statistics"),
  async execute(interaction) {
    const guildStats = stats[interaction.guild.id];
    if (!guildStats) {
      return interaction.reply("This server has no statistics yet!");
    }

    const topNerder = Object.entries(guildStats)
      .filter(([k]) => k.length === 18)
      .map(([
        k,
        v
      ]) => [
        k,
        v.nerdsGiven ?? 0
      ])
      .sort(([, f], [, s]) => s - f)[0];

    const topNerded = Object.entries(guildStats)
      .filter(([k]) => k.length === 18)
      .map(([
        k,
        v
      ]) => [
        k,
        Object.values(v.nerdEmojis).reduce((sum, count) => sum + count, 0)
      ])
      .sort(([, f], [, s]) => s - f)[0];

    const topScores = Object.entries(guildStats)
      .filter(([k]) => k.length === 18)
      .map(([
        k,
        v
      ]) => [
        k,
        v.score
      ])
      .sort(([, f], [, s]) => s - f);

    const reputations = Object.entries(guildStats)
      .filter(([k]) => k.length === 18)
      .map(([
        k,
        v
      ]) => [
        k,
        v.reputation ?? 0
      ]);

    const topReputation =
      [...reputations].sort(([, f], [, s]) => s - f)[0];
    const bottomReputation =
      [...reputations].sort(([, f], [, s]) => f - s)[0];

    let outputMessage = `Top nerder: ${module.exports.getNickname(
      interaction,
      topNerder[0]
    )} (${
      topNerder[1]
    } emojis given)\nMost nerded: ${module.exports.getNickname(
      interaction,
      topNerded[0]
    )} (${
      topNerded[1]
    } emojis received)\nHighest reputation: ${module.exports.getNickname(
      interaction,
      topReputation[0]
    )} (${
      topReputation[1]
    } reputation)\nLowest reputation: ${module.exports.getNickname(
      interaction,
      bottomReputation[0]
    )} (${bottomReputation[1]} reputation)\n\n`;

    const data = [];

    /* eslint-disable sort-keys*/
    topScores.slice(0, 10, topScores.length).forEach((a, i) => {
      data.push({
        "#": i + 1,
        Name: module.exports.getNickname(interaction, a[0]),
        Msgs:
          guildStats[a[0]].messages + guildStats[a[0]].previousMessages,
        Time: module.exports.formatTime(
          guildStats[a[0]].voiceTime + guildStats[a[0]].previousVoiceTime
        ),
        Rep: module.exports.formatReputation(
          module.exports.addLeadingZero(guildStats[a[0]].reputation ?? 0)
        ),
        Rank: `${module.exports.getRanking(guildStats[a[0]])} (${a[1]}SR)`,
        "★": module.exports.getPrestige(guildStats[a[0]].prestige)
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
      outputMessage += `\nYour ranking (${module.exports.getNickname(
        interaction,
        userRanking[0]
      )}): #${userRanking[2] + 1} (${module.exports.getRanking(
        guildStats[userRanking[0]]
      )}, ${guildStats[userRanking[0]].score}SR)`;
    }

    return interaction.reply(`\`\`\`ansi\n${outputMessage}\n\`\`\``);
  },
  /* eslint-disable sort-keys */
  addLeadingZero: (num) => {
    if (num > -10 && num < 10) {
      return num >= 0
        ? `0${num}`
        : `-0${Math.abs(num)}`;
    }
    return num;
  },
  formatTime: (seconds) => {

    /*
     * Note: this will only work up to 30d 23h 59m 59s
     * this is because toISOString() returns 1970-01-01T03:12:49.000Z (eg)
     * if anybody hits this, gold star - 11/02/24
     */
    const date = new Date(null);
    date.setSeconds(seconds);
    const unitArray = date.toISOString().substr(8, 11).split(/:|T/u);
    return `${parseInt(unitArray[0], 10) - 1 > 9
      ? ""
      : " "}${
      parseInt(unitArray[0], 10) - 1
    }d ${unitArray[1]}h ${unitArray[2]}m ${unitArray[3]}s`;
  },
  formatReputation: (rep) =>
    `${module.exports.getColorCode(rep)}${rep}\u001b[0m`,
  getColorCode: (rep) => {
    if (rep > 0) {
      return "\u001b[1;32m";
    }
    if (rep < 0) {
      return "\u001b[1;31m";
    }
    return "\u001b[1;00m";
  },
  getPrestige: (prestige) => `\u001b[33m${"★".repeat(prestige ?? 0)}\u001b[0m`,
  getNickname: (interaction, id) => {
    const member = interaction.guild.members.cache
      .filter((m) => m.id === id)
      .first();
    return `${member.displayName}`;
  },
  getRanking: (memberStats) => {
    let rankString = "MISSINGNO";
    Object.entries(ranks).forEach(([
      k,
      v
    ]) => {
      if (v[0] <= memberStats.score) {
        rankString = `${v[1]}${k}\u001b[0m`;
      }
    });
    return rankString;
  }
};
