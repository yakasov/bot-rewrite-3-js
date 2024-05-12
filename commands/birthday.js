"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { mainGuildId, bdayRoleId } = require("../resources/config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("Birthday functions for the birthday person!")
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription(
          "Whether to set the bot name, server name or owner name"
        )
        .setRequired(true)
        .addChoices(
          { name: "Bot name", value: "bot" },
          { name: "Server name", value: "server" },
          { name: "Owner name", value: "owner" }
        ))
    .addStringOption((opt) =>
      opt
        .setName("value")
        .setDescription("What to set the name to")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(32)),
  async execute(interaction) {
    await interaction.client.application.fetch();

    const option = interaction.options.getString("type");
    const value = interaction.options.getString("value");

    if (interaction.guild.id !== mainGuildId) {
      return interaction.reply({
        content: "Incorrect guild!",
        ephemeral: true,
      });
    }

    const roleMembers = Array.from(
      interaction.guild.roles.cache
        .find((r) => r.id === bdayRoleId)
        .members.keys()
    );

    if (
      !roleMembers.includes(interaction.user.id) &&
      interaction.user !== interaction.client.application.owner
    ) {
      return interaction.reply({
        content: "It is not your birthday!",
        ephemeral: true,
      });
    }

    try {
      switch (option) {
      case "bot":
        // Surely there is a better way?
        await interaction.guild.members.fetch()
          .then((members) =>
            members
              .filter((m) => m.id === interaction.client.user.id)
              .first()
              .setNickname(value));
        break;
      case "server":
        await interaction.guild.setName(value);
        break;
      case "owner":
        return interaction.reply({
          content:
              "Due to Discord limitations, this is not possible :(\n\nPlease message me instead!",
          ephemeral: true,
        });
      default:
        return interaction.reply({
          content: "Not implemented yet...",
          ephemeral: true,
        });
      }

      return interaction.reply({
        content: `Set ${option} name successfully!`,
        ephemeral: true,
      });
    } catch (e) {
      return interaction.reply(e.message);
    }
  },
};
