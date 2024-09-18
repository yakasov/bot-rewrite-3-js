"use strict";

const { SlashCommandBuilder } = require("discord.js");
const achievements = require("../resources/achievements.json");

function strikethrough(text) {
  // I might use this for grey achievements?
  return text
    .split("")
    .map((char) => `${char}\u0336`)
    .join("");
}

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("achievements")
    .setDescription("See your achievements"),
  async execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const unlocks = globalThis.stats[guildId][userId].achievements;

    const secretAchievements = Object.entries(achievements)
      .filter((a) => unlocks.includes(a[0]) && a[1].secret)
      .map(([, v]) => v.name);
    const allNormalAchievements = Object.entries(achievements)
      .filter((a) => !a[1].secret)
      .map(([, v]) => v.name);

    await interaction.reply(
      `\`\`\`ansi\n===== Achievements =====\n${
        allNormalAchievements
          .map((a) => `• \u001b[${unlocks.includes(a)
            ? 32
            : 31};000m ${a}\u001b[0m`)
          .join("\n")
      }\n\n===== Secret Achievements =====\n${
        secretAchievements
          .map((a) => `• \u001b[32;000m ${a}`)
          .join("\n")
      }\`\`\``
    );
  }
};
