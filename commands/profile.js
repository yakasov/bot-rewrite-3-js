"use strict";

const { SlashCommandBuilder } = require("discord.js");
const {
  formatTime,
  getLevelName,
  getNicknameInteraction,
  getRequiredExperience,
  getTitle
} = require("../util/common.js");

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Shows personal statistics")
    .addUserOption((opt) =>
      opt.setName("user")
        .setDescription("The user to get the profile of"))
    .addBooleanOption((opt) =>
      opt.setName("debug")
        .setDescription("Whether to print the raw statistics")),
  async execute(interaction) {
    await interaction.deferReply({ "ephemeral": true });

    let user = interaction.options.getUser("user") ?? null;
    if (user) {
      user = user.id;
    }
    const debug = interaction.options.getBoolean("debug") ?? false;

    const guildStats = globalThis.stats[interaction.guild.id];
    if (!guildStats) {
      return interaction.reply("This server has no statistics yet!");
    }

    if (user) {
      if (!guildStats[user]) {
        return interaction.reply("This user has no statistics yet!");
      }
    }

    const userStats = Object.entries(guildStats)
      .filter(([k]) => k.length === 18)
      .map(([k, v]) => [
        k,
        v.totalExperience
      ])
      .sort(([, f], [, s]) => s - f)
      .map(([k, v], i) => [
        k,
        v,
        i
      ])
      .find(([k, ,]) => k === (user ?? interaction.user.id));

    const allUserStats = guildStats[userStats[0]];

    if (debug) {
      const outputMessage = JSON.stringify(allUserStats, null, 4);
      const outputArray = outputMessage.match(/[\s\S]{1,1980}(?!\S)/gu);
      outputArray.forEach(async (r) => {
        await interaction.followUp(`\`\`\`json\n${r}\n\`\`\``);
      });
      return null;
    }

    const outputMessage = `=== Profile for ${getNicknameInteraction(
      interaction,
      userStats[0]
    )}, #${userStats[2] + 1} on server ===\n    Messages: ${
      allUserStats.messages
    }\n    Voice Time: ${formatTime(
      allUserStats.voiceTime
    )}\n\n    Level: ${allUserStats.level} (${allUserStats.levelExperience}/${
      getRequiredExperience(allUserStats.level)
    })\n    Title: ${getTitle(
      allUserStats
    )}\n    Ranking: ${getLevelName(allUserStats.level)} (${
      allUserStats.totalExperience
    } XP)`;

    await interaction.followUp(
      `Showing profile for ${getNicknameInteraction(
        interaction,
        userStats[0]
      )}...`
    );
    const outputArray = outputMessage.match(/[\s\S]{1,1980}(?!\S)/gu);
    outputArray.forEach(async (r) => {
      await interaction.followUp({
        "content": `\`\`\`ansi\n${r}\n\`\`\``,
        "ephemeral": false
      });
    });
    return null;
  }
};
