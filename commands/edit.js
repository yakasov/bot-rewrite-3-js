"use strict";

const { MessageFlags, SlashCommandBuilder } = require("discord.js");

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

    await interaction.client.application.fetch();
    if (
      interaction.user === interaction.client.application.owner ||
      interaction.user.id === (await interaction.guild.fetchOwner()).user.id
    ) {
      try {
        const newVal = (/^-?\d+$/u).test(value) ? parseInt(value, 10) : value;
        if (add) {
          if (
            typeof globalThis.stats[interaction.guild.id][user][attribute] !==
              "number" ||
            typeof newVal !== "number"
          ) {
            return interaction.reply({
              content: `Cannot add non-numeric values to attribute "${attribute}".`,
              flags: MessageFlags.Ephemeral
            });
          }
          globalThis.stats[interaction.guild.id][user][attribute] += newVal;
        } else {
          globalThis.stats[interaction.guild.id][user][attribute] = newVal;
        }

        return interaction.reply(
          `Set user ${user} attribute ${attribute} to value ${
            globalThis.stats[interaction.guild.id][user][attribute]
          }`
        );
      } catch (e) {
        return interaction.reply(e.message);
      }
    }

    return interaction.reply({
      content: "You are not an admin user!",
      flags: MessageFlags.Ephemeral
    });
  }
};
