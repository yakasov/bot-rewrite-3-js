"use strict";

const fs = require("fs");
const { SlashCommandBuilder } = require("discord.js");
const { generateRollTable } = require("../util/rollTableGenerator.js");
const chanceResponses = require("../resources/chanceResponses.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("editresponses")
    .setDescription("Edit the chance responses table")
    .addStringOption((opt) =>
      opt
        .setName("key")
        .setDescription("The response to edit")
        .setRequired(true))
    .addStringOption((opt) =>
      opt.setName("string")
        .setDescription("The string to reply with"))
    .addNumberOption((opt) =>
      opt
        .setName("chance")
        .setDescription("The chance to reply to a given message"))
    .addStringOption((opt) =>
      opt.setName("type")
        .setDescription("Message or react")),
  async execute(interaction) {
    const key = interaction.options.getString("key");
    const string = interaction.options.getString("string") ?? false;
    const chance = interaction.options.getNumber("chance") ?? false;
    const type = interaction.options.getString("type") ?? false;

    await interaction.client.application.fetch();
    if (
      interaction.user === interaction.client.application.owner ||
      interaction.user.id === (await interaction.guild.fetchOwner()).user.id
    ) {
      try {
        if (!chanceResponses[key] && !(string && chance && type)) {
          return interaction.reply({
            content: "Key does not exist and not enough values provided.",
            ephemeral: true
          });
        }

        chanceResponses[key] = {
          chance: chance ?? chanceResponses[key].chance,
          string: string ?? chanceResponses[key].string,
          type: type ?? chanceResponses[key].type
        };

        globalThis.rollTable = generateRollTable(chanceResponses);

        fs.writeFileSync(
          "./resources/chanceResponses.json",
          JSON.stringify(chanceResponses)
        );

        return interaction.reply(`Updated ${key}.`);
      } catch (e) {
        return interaction.reply(e.message);
      }
    }

    return interaction.reply({
      content: "You are not an admin user!",
      ephemeral: true
    });
  }
};
