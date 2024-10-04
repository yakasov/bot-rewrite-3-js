"use strict";

const { SlashCommandBuilder } = require("discord.js");
const moment = require("moment-timezone");
const { statsConfig } = require("../resources/config.json");
const { getTimeInSeconds } = require("../util/common.js");

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("daily")
    .setDescription("Redeem your daily tokens"),
  execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    if (
      globalThis.stats[guildId][userId].lastDailyTime >
      module.exports.getLastMidnightUnix()
    ) {
      return interaction.reply("You have already claimed your daily!");
    }

    globalThis.stats[guildId][userId].lastDailyTime = getTimeInSeconds();
    globalThis.stats[guildId][userId].luckTokens += statsConfig.dailyTokens;

    return interaction.reply(
      `You have received ${statsConfig.dailyTokens} tokens!`
    );
  },
  "getLastMidnightUnix": () =>
    moment()
      .startOf("day")
      .unix()
      .toString()
};
