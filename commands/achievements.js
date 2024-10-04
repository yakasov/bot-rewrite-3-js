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
      .map(([
        k,
        v
      ]) => ({ "desc": v.desc,
        "key": k,
        "name": v.name }));

    await interaction.reply(
      `\`\`\`ansi\n===== Achievements =====\n${allNormalAchievements
        .map(
          (a) =>
            `• \u001b[1;${
              unlocks.includes(a.key)
                ? 32
                : 31
            }m ${a.name}\u001b[0m\u001b[2;${
              unlocks.includes(a.key)
                ? 32
                : 31
            }m - ${a.desc}\u001b[0m`
        )
        .join("\n")}\n\n===== Secret Achievements =====\n${secretAchievements
        .map((a) => `• \u001b[1;32m ${a}\u001b[0m`)
        .join("\n")}\`\`\``
    );
  }
};
