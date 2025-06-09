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
const { DISCORD_ID_LENGTH, TOP_SCORES_N } = require("../util/consts.js");
const globals = require("../util/globals.js");

function getRankedUsers(guildStats, guild) {
  return Object.entries(guildStats)
    .filter(
      ([k]) => k.length === DISCORD_ID_LENGTH && guild.members.cache.has(k)
    )
    .map(([k, v]) => [k, v.totalExperience])
    .sort(([, f], [, s]) => s - f);
}

function buildTableData(topScores, guildStats, interaction) {
  /* eslint-disable sort-keys */
  return topScores.slice(0, TOP_SCORES_N)
    .map((a, i) => ({
      "#": i + 1,
      Name: getNicknameInteraction(interaction, a[0], true),
      Level: `${guildStats[a[0]].level} (${guildStats[a[0]].levelExperience}/${getRequiredExperience(guildStats[a[0]].level)} XP)`,
      Msgs: guildStats[a[0]].messages,
      "Voice Time": formatTime(guildStats[a[0]].voiceTime),
      Title: getTitle(guildStats[a[0]]),
    }));
  /* eslint-enable sort-keys */
}

function formatUserRankingLine(topScores, guildStats, interaction) {
  const userRanking = topScores
    .map(([k, v], i) => [k, v, i])
    .find(([k]) => k === interaction.user.id);
  if (!userRanking) {
    return "";
  }
  return `\nYour ranking (${getNicknameInteraction(
    interaction,
    userRanking[0]
  )}): #${userRanking[2] + 1} (${getLevelName(
    guildStats[userRanking[0]].level
  )}, ${guildStats[userRanking[0]].totalExperience} XP)`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("stats")
    .setDescription("Show server statistics"),
  execute(interaction) {
    const guildStats = globals.get("stats")[interaction.guild.id];
    if (!guildStats) {
      return interaction.reply("This server has no statistics yet!");
    }

    const topScores = getRankedUsers(guildStats, interaction.guild);
    const data = buildTableData(topScores, guildStats, interaction);

    let outputMessage = generateTable(data);
    outputMessage += formatUserRankingLine(topScores, guildStats, interaction);

    return interaction.reply(`\`\`\`ansi\n${outputMessage}\n\`\`\``);
  },
};
