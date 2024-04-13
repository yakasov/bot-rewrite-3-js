"use strict";

const {
  ActionRowBuilder,
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle
} = require("discord.js");
const fs = require("fs");
const { statsConfig } = require("./../resources/config.json");
const stats = require("./../resources/stats.json");

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("prestige")
    .setDescription("Prestige to the next prestige level.")
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to force prestige (admin only)")),
  async execute(interaction) {
    await interaction.client.application.fetch();

    const user = interaction.options.getUser("user");
    const elevated =
      interaction.user === interaction.client.application.owner ||
      interaction.user.id === (await interaction.guild.fetchOwner()).user.id;
    const idToUse = elevated && user
      ? user.id
      : interaction.user.id;

    const guildStats = stats[interaction.guild.id];
    if (!guildStats) {
      return interaction.reply("This server has no statistics yet!");
    }
    if (!guildStats[idToUse]) {
      return interaction.reply("You do not have any statistics yet!");
    }

    if (!(elevated && user)) {
      if (
        guildStats[idToUse].prestige >= statsConfig.prestigeMaximum
      ) {
        return interaction.reply("You have reached max prestige!");
      }
      if (guildStats[idToUse].score < statsConfig.prestigeRequirement) {
        return interaction.reply(
          `You cannot prestige until ${statsConfig.prestigeRequirement}SR!`
        );
      }
    }

    const confirm = new ButtonBuilder()
      .setCustomId("y")
      .setLabel("Yes")
      .setStyle(ButtonStyle.Success);

    const cancel = new ButtonBuilder()
      .setCustomId("n")
      .setLabel("No")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder()
      .addComponents(confirm, cancel);

    const response = await interaction.reply({
      "components": [row],
      "content":
        `Prestiging will reset your SR back to 0, 
and your rank will be adjusted accordingly.\n
In return, you will gain a prestige mark and your 
SR gain will be boosted. Additionally, 
your +/-reps and reactions will have more weight.\n
Are you sure you want to prestige?`
    });

    const collectorFilter = (i) => elevated || i.user.id === idToUse;

    try {
      const confirmation = await response.awaitMessageComponent({
        "filter": collectorFilter,
        "time": 60_000
      });

      if (confirmation.customId === "y") {
        await confirmation.update({
          "components": [],
          "content": `${
            interaction.guild.members.cache
              .filter((m) => m.id === idToUse)
              .first().displayName
          } has prestiged to prestige ${guildStats[idToUse].prestige + 1}!`
        });

        stats[interaction.guild.id][idToUse] =
          module.exports.updateStats(stats[interaction.guild.id][idToUse]);

        return fs.writeFileSync(
          "./resources/stats.json",
          JSON.stringify(stats)
        );
      }
      return confirmation.update({
        "components": [],
        "content": "Prestige cancelled"
      });

    } catch (e) {
      return interaction.editReply({
        "components": [],
        "content": "Confirmation not received within 1 minute, cancelling"
      });
    }
  },
  "updateStats": (userStats) => {
    userStats.prestige++;
    userStats.bestRanking = "";
    userStats.bestScore = 0;

    // Store message + voiceTime values then reset them
    userStats.previousMessages += userStats.messages;
    userStats.previousVoiceTime += userStats.voiceTime;

    // Add nerdHandicap to offset nerdScore
    userStats.nerdHandicap =
          userStats.nerdScore **
            (userStats.prestige === 1
              ? 1.55
              : 0) *
          0.8;

    // Reset decay
    userStats.decay = 0;

    userStats.messages = 0;
    userStats.voiceTime = 0;

    return userStats;
  }
};
