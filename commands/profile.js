"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { statsConfig } = require("./../resources/config.json");
const stats = require("./../resources/stats.json");
const ranks = require("./../resources/ranks.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Shows personal statistics")
    .addUserOption((opt) =>
      opt.setName("user").setDescription("The user to get the profile of")
    )
    .addBooleanOption((opt) =>
      opt.setName("debug").setDescription("Whether to print the raw statistics")
    ),
  async execute(interaction) {
    await interaction.deferReply();

    let user = interaction.options.getUser("user") ?? null;
    if (user) {
      user = user.id;
    }
    const debug = interaction.options.getBoolean("debug") ?? false;

    const guildStats = stats[interaction.guild.id];
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
      const outputMessage =
        `\`\`\`\n${JSON.stringify(allUserStats, null, 4)}\`\`\``;
      const outputArray = outputMessage.match(/[\s\S]{1,1980}(?!\S)/gu);
      outputArray.forEach(async (r) => {
        await interaction.followUp(`\`\`\`json\n${r}\n\`\`\``);
      });
      return null;
    }

    const outputMessage = `=== Profile for ${module.exports.getNickname(
      interaction,
      userStats[0]
    )}, #${userStats[2] + 1} on server ===\n    Messages: ${
      allUserStats.messages + allUserStats.previousMessages
    }\n    Voice Time: ${module.exports.formatTime(
      allUserStats.voiceTime + allUserStats.previousVoiceTime
    )}\n    Prestige: ${module.exports.getPrestige(
      allUserStats
    )}\n\n    Ranking: ${module.exports.getRanking(allUserStats)} (${
      allUserStats.score
    }SR)\n    Ranking before penalties: ${Math.floor(
      (allUserStats.voiceTime * statsConfig.voiceChatSRGain +
        allUserStats.messages * statsConfig.messageSRGain) *
        Math.max(
          1 + (allUserStats.reputation ?? 0) * statsConfig.reputationGain,
          1
        ) *
        1.2 ** (allUserStats.prestige ?? 0)
    )}SR\n    Reputation: ${
      allUserStats.reputation ?? 0
    }\n    Decay: ${Math.round(
      allUserStats.decay
    )}\n\n    Nerd Emojis given: ${
      allUserStats.nerdsGiven ?? 0
    }\n    Nerd Emojis received: ${
      Object.values(allUserStats.nerdEmojis).reduce(
        (sum, a) => sum + a,
        0
      ) ?? 0
    }${userStats[2]
      ? ""
      : "\n    == #1 of friends! =="
    }\n\n`;

    const outputArray = outputMessage.match(/[\s\S]{1,1980}(?!\S)/gu);
    outputArray.forEach(async (r) => {
      await interaction.followUp(`\`\`\`ansi\n${r}\n\`\`\``);
    });
    return null;
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
    return `${parseInt(unitArray[0], 10) - 1}d 
    ${unitArray[1]}h ${unitArray[2]}m ${unitArray[3]}s`;
  },
  getNickname: (interaction, id) => {
    const member = interaction.guild.members.cache
      .filter((m) => m.id === id)
      .first();
    return `${member.displayName}`;
  },
  getPrestige: (memberStats) =>
    `${memberStats.prestige ?? 0} \u001b[33m${"★".repeat(
      memberStats.prestige ?? 0
    )}\u001b[0m`,
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
