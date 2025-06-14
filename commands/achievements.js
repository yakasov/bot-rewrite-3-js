"use strict";

const { SlashCommandBuilder } = require("discord.js");
const achievements = require("../resources/achievements.json");
const globals = require("../util/globals");

function formatAchievementLine(achievement, unlocked) {
  const color = unlocked ? 32 : 31;
  return `• \u001b[1;${color}m ${achievement.name}\u001b[0m\u001b[2;${color}m - ${achievement.desc}\u001b[0m`;
}

function formatAchievementsMessage(unlocks, allAchievements) {
  const secretAchievements = Object.entries(allAchievements)
    .filter(([, v]) => unlocks.includes(v.key) && v.secret)
    .map(([, v]) => v.name);

  const allNormalAchievements = Object.entries(allAchievements)
    .filter(([, v]) => !v.secret)
    .map(([k, v]) => ({ ...v, key: k }));

  const normalLines = allNormalAchievements
    .map((a) => formatAchievementLine(a, unlocks.includes(a.key)))
    .join("\n");

  const secretLines = secretAchievements
    .map((a) => `• \u001b[1;32m ${a}\u001b[0m`)
    .join("\n");

  return `\`\`\`ansi\n===== Achievements =====\n
    ${normalLines}
    \n\n===== Secret Achievements =====\n"
    ${secretLines}
    \`\`\``;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("achievements")
    .setDescription("See your achievements"),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const userStats = globals.get("stats")[guildId]?.[userId];

    const unlocks = userStats.achievements;
    const message = formatAchievementsMessage(unlocks, achievements);

    await interaction.reply(message);
  },
};
