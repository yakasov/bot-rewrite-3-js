"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { formatTime, getNicknameInteraction, getPrestige, getRanking } = require("../util/common.js");
const { statsConfig } = require("../resources/config.json");

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
      .map(([
        k,
        v
      ]) => [
        k,
        v.score
      ])
      .sort(([, f], [, s]) => s - f)
      .map(([
        k,
        v
      ], i) => [
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

    const rankingBeforePenalties = Math.floor(
      (allUserStats.voiceTime * statsConfig.voiceChatSRGain +
        allUserStats.messages * statsConfig.messageSRGain) *
        Math.max(1 + allUserStats.reputation * statsConfig.reputationGain, 1) *
        1.2 ** allUserStats.prestige +
        allUserStats.luckHandicap +
        allUserStats.coolScore
    );

    const outputMessage = `=== Profile for ${getNicknameInteraction(
      interaction,
      userStats[0]
    )}, #${userStats[2] + 1} on server ===\n    Messages: ${
      allUserStats.messages + allUserStats.previousMessages
    }\n    Voice Time: ${formatTime(
      allUserStats.voiceTime + allUserStats.previousVoiceTime
    )}\n    Prestige: ${getPrestige(
      allUserStats
    )}\n\n    Ranking: ${getRanking(allUserStats)} (${
      allUserStats.score
    }SR)\n    Ranking before penalties: ${
      rankingBeforePenalties
    }SR\n    Reputation: ${
      allUserStats.reputation
    }\n\n    Nerd Emojis given: ${
      allUserStats.nerdsGiven
    }\n    Nerd Emojis received: ${
      Object.values(allUserStats.nerdEmojis)
        .reduce((sum, a) => sum + a, 0) ?? 0
    }\n    Cool Emojis given: ${
      allUserStats.coolsGiven
    }\n    Cool Emojis received: ${
      Object.values(allUserStats.coolEmojis)
        .reduce((sum, a) => sum + a, 0) ?? 0
    }\n\n    Nerd Penalty: -${Math.floor(allUserStats.nerdScore)} ${
      allUserStats.nerdHandicap
        ? `(offset by ${Math.floor(allUserStats.nerdHandicap)})`
        : ""
    }\n    Cool Bonus: ${Math.floor(allUserStats.coolScore)} ${
      allUserStats.coolHandicap
        ? `(offset by -${Math.floor(allUserStats.coolHandicap)})`
        : ""
    }\n    Luck Bonus: ${allUserStats.luckHandicap}${
      userStats[2]
        ? ""
        : "\n\n    == #1 of friends! =="
    }`;

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
