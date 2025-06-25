"use strict";

const { MessageFlags, SlashCommandBuilder } = require("discord.js");
const { validateStats } = require("../util/statsValidation");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("edit")
    .setDescription("Edit a user's statistics")
    .addUserOption((opt) =>
      opt.setName("user")
        .setDescription("The user to edit")
        .setRequired(true))
    .addStringOption((opt) =>
      opt
        .setName("attribute")
        .setDescription("The attribute to edit")
        .setRequired(true))
    .addStringOption((opt) =>
      opt
        .setName("value")
        .setDescription("The value to set the attribute to")
        .setRequired(true))
    .addBooleanOption((opt) =>
      opt.setName("add")
        .setDescription("If the value should be set or added")),
  async execute(interaction) {
    const user = interaction.options.getUser("user").id;
    const attribute = interaction.options.getString("attribute");
    const value = interaction.options.getString("value");
    const add = interaction.options.getBoolean("add") ?? false;
    
    const validation = validateStats(interaction, user);
    if (!validation.success) {
      return interaction.reply({
        content: validation.errorMessage,
        flags: MessageFlags.Ephemeral,
      });
    }
    
    const { userStats } = validation;

    await interaction.client.application.fetch();
    if (
      interaction.user === interaction.client.application.owner ||
      interaction.user.id === (await interaction.guild.fetchOwner()).user.id
    ) {
      try {
        const newValue = /^-?\d+$/u.test(value) ? parseInt(value, 10) : value;
        if (add) {
          if (
            typeof userStats[attribute] !== "number" ||
            typeof newValue !== "number"
          ) {
            return interaction.reply({
              content: `Cannot add non-numeric values to attribute "${attribute}".`,
              flags: MessageFlags.Ephemeral,
            });
          }
          userStats[attribute] += newValue;
        } else {
          userStats[attribute] = newValue;
        }

        return interaction.reply(
          `Set user ${user} attribute ${attribute} to value ${
            userStats[attribute]
          }`
        );
      } catch (err) {
        return interaction.reply(err.message);
      }
    }

    return interaction.reply({
      content: "You are not an admin user!",
      flags: MessageFlags.Ephemeral,
    });
  },
};
