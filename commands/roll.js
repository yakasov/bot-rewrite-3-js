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
        .setMinValue(1))
    .addBooleanOption((opt) =>
      opt
        .setName("max")
        .setDescription("Whether to use all tokens. Overrides amount")),
  async execute(interaction) {
    await interaction.deferReply();
    const useMax = interaction.options.getBoolean("max") ?? false;
    const tokens =
      globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens;
    const rollCount = useMax
      ? tokens
      : interaction.options.getInteger("amount") ?? 1;
    let response = "";

    const rolls = [];
    const changes = {
      "exp": 0,
      "exp_percent": 0,
      "reputation": 0,
      "tokens": 0
    };

    if (!tokens) {
      return interaction.editReply("You don't have any tokens!");
    }

    if (tokens < rollCount) {
      return interaction.editReply("You don't have enough tokens!");
    }

    for (let i = 0; i < rollCount; i++) {
      globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens--;
      const roll1 = module.exports.rollDice();
      const roll2 = module.exports.rollDice();
      const roll3 = (module.exports.rollDice() % 5) + 1;
      const roll = (roll1 + roll2 - 2) / 2 + 0.2 * roll3;
      const result = module.exports.getLuckAction(roll);
      rolls.push(roll);

      switch (result.action.type) {
      case "exp":
        globalThis.stats[interaction.guild.id][
          interaction.user.id
        ].luckHandicap += result.action.amount;
        changes.exp += result.action.amount;
        break;
      case "exp_percent":
        globalThis.stats[interaction.guild.id][
          interaction.user.id
        ].luckHandicap += globalThis.stats[interaction.guild.id][
          interaction.user.id
        ].levelExperience * result.action.amount;
        changes.exp_percent += result.action.amount * 100;
        break;
      case "reputation":
        globalThis.stats[interaction.guild.id][
          interaction.user.id
        ].reputation += result.action.amount;
        changes.reputation += result.action.amount;
        break;
      case "token":
        globalThis.stats[interaction.guild.id][
          interaction.user.id
        ].luckTokens += result.action.amount;
        changes.tokens += result.action.amount;
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

      if (changes.exp) {
        response += `You have ${
          changes.exp > 0
            ? "gained"
            : "lost"
        } ${Math.abs(changes.exp)} experience!\n`;
      }

      if (changes.exp_percent) {
        response += `You have ${
          changes.exp_percent > 0
            ? "gained"
            : "lost"
        } ${Math.abs(changes.exp_percent * 100)}% experience!\n`;
      }

      if (changes.reputation) {
        response += `You have ${
          changes.reputation > 0
            ? "gained"
            : "lost"
        } ${Math.abs(changes.reputation)} reputation!\n`;
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
