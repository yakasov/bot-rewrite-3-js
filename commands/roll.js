"use strict";

const { SlashCommandBuilder } = require("discord.js");
const luckTable = require("./../resources/luckTable.json");


module.exports = {
  "data": new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Use tokens to gamble for rewards!"),
  async execute(interaction) {
    await interaction.deferReply();
    const tokens =
      globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens;

    if (!tokens) {
      return interaction.editReply("You don't have any tokens!");
    }

    globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens--;
    const roll = module.exports.rollDice();
    const result = module.exports.getLuckAction(roll);
    /* eslint-disable-next-line array-element-newline*/
    const aOrAn = [8, 11, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89]
      .includes(roll)
      ? "an"
      : "a";

    switch (result.action.type) {
    case "reputation":
      globalThis.stats[interaction.guild.id][interaction.user.id]
        .reputation += result.action.amount;
      break;
    case "score":
      globalThis.stats[interaction.guild.id][interaction.user.id]
        .luckHandicap += result.action.amount;
      break;
    case "token":
      globalThis.stats[interaction.guild.id][interaction.user.id]
        .luckTokens += 2;
      break;
    default:
      break;
    }

    const response = `You rolled ${aOrAn} ${roll}.
${result.description}\n
${module.exports.getTokenString(
    globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens
  )}`;

    return interaction.editReply(response);
  },
  getLuckAction(roll) {
    return luckTable.find((result) => roll >= result.min && roll < result.max);
  },
  getTokenString(tokens) {
    if (tokens) {
      return `You have ${tokens} token${tokens === 1
        ? ""
        : "s"} left.`;
    }
    return "You have no more tokens!";
  },
  rollDice() {
    return Math.floor(Math.random() * 100) + 1;
  }
};
