"use strict";

const { MessageFlags, SlashCommandBuilder } = require("discord.js");
const {
  formatTime,
  getLevelName,
  getNicknameFromInteraction,
  getRequiredExperience,
  getTitle,
} = require("../util/common.js");
const { DISCORD_ID_LENGTH } = require("../util/consts.js");
const globals = require("../util/globals.js");

function findUserStatsAndRank(guildStats, userId) {
  /*
   * This is a complicated chain
   * Essentially, find all user stats by matching keys to DISCORD_ID_LENGTH,
   * map those stats to be [id, totalExperience],
   * order all those stats using totalExperience,
   * and then map the ordered stats to [id, totalExperience, rankPosition].
   * 
   * After, find the entry matching the user ID and return it.
   * 
   * TODO: There is _definitely_ a better way to do this.
   */
  const ranked = Object.entries(guildStats)
    .filter(([k]) => k.length === DISCORD_ID_LENGTH)
    .map(([k, v]) => [k, v.totalExperience])
    .sort(([, f], [, s]) => s - f)
    .map(([k], i) => [k, i]);
  const found = ranked.find(([k]) => k === userId);
  return found ? { rank: found[1] + 1, userStats: found } : null;
}

function formatProfileOutput(interaction, userStats, allUserStats, rank) {
  return `=== Profile for ${getNicknameFromInteraction(
    interaction,
    userStats[0]
  )}, #${rank} on server ===\n    Messages: ${
    allUserStats.messages
  }\n    Voice Time: ${formatTime(
    allUserStats.voiceTime
  )}\n\n    Level: ${allUserStats.level} (${allUserStats.levelExperience}/${getRequiredExperience(
    allUserStats.level
  )})\n    Title: ${getTitle(
    allUserStats
  )}\n    Ranking: ${getLevelName(allUserStats.level)} (${
    allUserStats.totalExperience
  } XP)`;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Shows personal statistics")
    .addUserOption((opt) =>
      opt.setName("user")
        .setDescription("The user to get the profile of"))
    .addBooleanOption((opt) =>
      opt.setName("debug")
        .setDescription("Whether to print the raw statistics")),
  async execute(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    let user = interaction.options.getUser("user") ?? null;
    if (user) {
      user = user.id;
    }
    const debug = interaction.options.getBoolean("debug") ?? false;

    const guildStats = globals.get("stats")[interaction.guild.id];
    if (!guildStats) {
      return interaction.reply("This server has no statistics yet!");
    }

    const userId = user ?? interaction.user.id;
    if (!guildStats[userId]) {
      return interaction.reply("This user has no statistics yet!");
    }

    const found = findUserStatsAndRank(guildStats, userId);
    if (!found) {
      return interaction.reply("Could not find user stats.");
    }
    const { userStats, rank } = found;
    const allUserStats = guildStats[userStats[0]];

    if (debug) {
      const outputMessage = JSON.stringify(allUserStats, null, 4);
      const outputArray = outputMessage.match(/[\s\S]{1,1980}(?!\S)/gu);
      for (const r of outputArray) {
        await interaction.followUp(`\`\`\`json\n${r}\n\`\`\``);
      }
      return null;
    }

    const outputMessage = formatProfileOutput(
      interaction,
      userStats,
      allUserStats,
      rank
    );

    await interaction.followUp(
      `Showing profile for ${getNicknameFromInteraction(
        interaction,
        userStats[0]
      )}...`
    );

    const outputArray = outputMessage.match(/[\s\S]{1,1980}(?!\S)/gu);
    for (const r of outputArray) {
      await interaction.followUp({
        content: `\`\`\`ansi\n${r}\n\`\`\``,
        ephemeral: false,
      });
    }
    return null;
  },
};
