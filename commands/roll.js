"use strict";

const { SlashCommandBuilder } = require("discord.js");
const luckTable = require("../resources/luckTable.json");

module.exports = {
  aOrAn(roll) {
    /* eslint-disable-next-line array-element-newline*/
    return [8, 11, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89].includes(roll)
      ? "an"
      : "a";
  },
  "data": new SlashCommandBuilder()
    .setName("roll")
    .setDescription("Use tokens to gamble for rewards!")
    .addIntegerOption((opt) =>
      opt
        .setName("amount")
        .setDescription("The amount of rolls to perform")
        .setMinValue(1)),
  async execute(interaction) {
    await interaction.deferReply();
    const rollCount = interaction.options.getInteger("amount") ?? 1;
    const tokens =
      globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens;
    let response = "";

    const rolls = [];
    const changes = { "reputation": 0,
      "score": 0,
      "tokens": 0 };

    if (!tokens) {
      return interaction.editReply(
        "You don't have any tokens!\n\n\nWait, or get more with /sell!"
      );
    }

    if (tokens < rollCount) {
      return interaction.editReply(
        "You don't enough tokens!\n\nWait, or get more with /sell!"
      );
    }

    for (let i = 0; i < rollCount; i++) {
      globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens--;
      const roll1 = module.exports.rollDice();
      const roll2 = module.exports.rollDice();
      const roll3 = module.exports.rollDice() % 5 + 1;
      const roll = (roll1 + roll2 - 2) / 2 + 0.2 * roll3;
      const result = module.exports.getLuckAction(roll);
      rolls.push(roll);

      switch (result.action.type) {
      case "reputation":
        globalThis.stats[interaction.guild.id][
          interaction.user.id
        ].reputation += result.action.amount;
        changes.reputation += result.action.amount;
        break;
      case "score":
        globalThis.stats[interaction.guild.id][
          interaction.user.id
        ].luckHandicap += result.action.amount;
        changes.score += result.action.amount;
        break;
      case "token":
        globalThis.stats[interaction.guild.id][
          interaction.user.id
        ].luckTokens += 2;
        changes.tokens += 2;
        break;
      default:
        break;
      }

      if (rollCount === 1) {
        response = `You rolled ${module.exports.aOrAn(
          roll1
        )} ${roll1}, ${module.exports.aOrAn(
          roll2
        )} ${roll2} and ${module.exports.aOrAn(roll3)} ${roll3} (= ${
          Math.floor(roll) + 0.2 * roll3
        }).
${result.description}\n
${module.exports.getTokenString(
    globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens
  )}`;
      }
    }

    if (rollCount !== 1) {
      response = `You rolled the following: \`${rolls.join(
        ", "
      )}\`, resulting in these results:\n\n`;

      if (changes.reputation) {
        response += `You have ${
          changes.reputation > 0
            ? "gained"
            : "lost"
        } ${Math.abs(changes.reputation)} reputation!\n`;
      }

      if (changes.score) {
        response += `You have ${
          changes.score > 0
            ? "gained"
            : "lost"
        } ${Math.abs(changes.score)} score!\n`;
      }

      if (changes.tokens) {
        response += `You have gained ${changes.tokens} tokens!\n`;
      }

      response += `\n${module.exports.getTokenString(
        globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens
      )}`;
    }

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
