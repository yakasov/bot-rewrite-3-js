"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} = require("discord.js");
const { buy } = require("../resources/store.json");

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("buy")
    .setDescription("Buy stats using tokens")
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription("The stat to purchase")
        .setRequired(true)
        .addChoices(
          { "name": "x1 reputation",
            "value": "reputation" },
          { "name": "x600 score",
            "value": "score" }
        ))
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("The amount of the stat to purchase")
        .setRequired(true)
        .setMinValue(1)),
  async execute(interaction) {
    const type = interaction.options.getString("type");
    const amount = interaction.options.getInteger("amount");

    const trueType = type === "score"
      ? "luckHandicap"
      : type;
    const buyAmount = amount * buy[type];

    const g = interaction.guild.id;
    const u = interaction.user.id;

    if (globalThis.stats[g][u].luckTokens === 0) {
      return interaction.reply({
        "content": "You cannot purchase anything without tokens!",
        "ephemeral": true
      });
    }

    if (globalThis.stats[g][u].luckTokens < amount) {
      return interaction.reply({
        "content": `You do not have enough tokens to purchase ${buyAmount} ${type}!`,
        "ephemeral": true
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
      "components": [row],
      "content": `Purchase ${buyAmount} ${type} for ${amount} token${
        amount === 1
          ? ""
          : "s"
      }?`,
      "ephemeral": true
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;

    try {
      const confirmation = await response.awaitMessageComponent({
        "filter": collectorFilter,
        "time": 60_000
      });

      if (confirmation.customId === "y") {
        globalThis.stats[g][u].luckTokens -= amount;
        globalThis.stats[g][u][trueType] += buyAmount;

        return confirmation.update({
          "components": [],
          "content": `You have purchased ${buyAmount} ${type}!`
        });
      }

      return confirmation.update({
        "components": [],
        "content": "Purchase cancelled."
      });
    } catch (e) {
      return interaction.editReply({
        "components": [],
        "content": "Confirmation not received within 1 minute, cancelling"
      });
    }
  },
  "f": () => Math.floor(Date.now() / 1000)
};
