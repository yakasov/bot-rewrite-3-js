"use strict";

const { MessageFlags, SlashCommandBuilder } = require("discord.js");
const {
  formatTime,
  getLevelName,
  getNicknameFromInteraction,
  getRequiredExperience,
  getTitle,
  wrapCodeBlockString,
} = require("../util/common.js");
const { orderStatsByRank } = require("../util/stats/stats.js");
const { validateStats } = require("../util/statsValidation.js");
const { REGEX_DISCORD_MESSAGE_LENGTH_SHORT } = require("../util/consts.js");

function findUserStatsAndRank(guildStats, guild, userId) {
  const ranked = orderStatsByRank(guildStats, guild)
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

    const userId = user ?? interaction.user.id;
    const validation = validateStats(interaction, userId);
    if (!validation.success) {
      return interaction.editReply(validation.errorMessage);
    }
    
    const { guildStats } = validation;

    const found = findUserStatsAndRank(guildStats, interaction.guild, userId);
    if (!found) {
      return interaction.editReply("Could not find user stats.");
    }
    const { userStats, rank } = found;
    const allUserStats = guildStats[userStats[0]];

    if (debug) {
      const outputMessage = JSON.stringify(allUserStats, null, 4);
      const outputArray = outputMessage.match(REGEX_DISCORD_MESSAGE_LENGTH_SHORT);
      for (const r of outputArray) {
        await interaction.followUp(wrapCodeBlockString(r, "json"));
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

    const outputArray = outputMessage.match(REGEX_DISCORD_MESSAGE_LENGTH_SHORT);
    for (const r of outputArray) {
      await interaction.followUp({
        content: wrapCodeBlockString(r, "ansi"),
        ephemeral: false,
      });
    }
    return null;
  },
};
