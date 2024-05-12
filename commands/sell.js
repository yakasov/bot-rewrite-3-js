"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} = require("discord.js");
const { sell } = require("../resources/store.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("sell")
    .setDescription("Sell stats for tokens")
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription("The stat to sell")
        .setRequired(true)
        .addChoices(
          { name: "x1 reputation", value: "reputation" },
          { name: "x750 score", value: "score" }
        ))
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("The amount of the stat to sell")
        .setRequired(true)
        .setMinValue(1)),
  async execute(interaction) {
    const type = interaction.options.getString("type");
    const amount = interaction.options.getInteger("amount");

    const trueType = type === "score" ? "luckHandicap" : type;
    const sellAmount = amount * sell[type];

    const g = interaction.guild.id;
    const u = interaction.user.id;

    if (globalThis.stats[g][u][type] < sellAmount) {
      return interaction.reply({
        content: `You do not have enough ${type} to sell!`,
        ephemeral: true,
      });
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
      components: [row],
      content: `Sell ${sellAmount} ${type} for ${amount} token${
        amount === 1 ? "" : "s"
      }?`,
      ephemeral: true,
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;

    try {
      const confirmation = await response.awaitMessageComponent({
        filter: collectorFilter,
        time: 60_000,
      });

      if (confirmation.customId === "y") {
        globalThis.stats[g][u].luckTokens += amount;
        globalThis.stats[g][u][trueType] -= sellAmount;

        return confirmation.update({
          components: [],
          content: `You have sold ${sellAmount} ${type}!`,
        });
      }

      return confirmation.update({
        components: [],
        content: "Sell order cancelled.",
      });
    } catch (e) {
      return interaction.editReply({
        components: [],
        content: "Confirmation not received within 1 minute, cancelling",
      });
    }
  },
  f: () => Math.floor(Date.now() / 1000),
};
