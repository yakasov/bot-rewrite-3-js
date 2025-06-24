"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  SlashCommandBuilder
} = require("discord.js");
const roles = require("../resources/roles.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("claim")
    .setDescription("Claim (or remove) public roles (e.g for games)")
    .addStringOption((opt) =>
      opt
        .setName("role")
        .setDescription("The role to claim")
        .addChoices(...roles)),
  async execute(interaction) {
    await interaction.deferReply({
      flags: MessageFlags.Ephemeral
    });
    const roleID = interaction.options.getString("role");
    const role = interaction.guild.roles.cache.get(roleID);

    if (interaction.member.roles.cache.has(roleID)) {
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

      const response = await interaction.editReply({
        components: [row],
        content: "You already have this role. Remove it?"
      });

      const collectorFilter = (i) => i.user.id === interaction.user.id;

      try {
        const confirmation = await response.awaitMessageComponent({
          filter: collectorFilter,
          time: 60_000
        });

        if (confirmation.customId === "y") {
          await interaction.member.roles.remove(role);
          return confirmation.update({
            components: [],
            content: `You have removed the role ${role.name}.`,
            flags: MessageFlags.Ephemeral
          });
        }
        return confirmation.update({
          components: [],
          content: "Role claim cancelled.",
          flags: MessageFlags.Ephemeral
        });
      } catch (err) {
        return interaction.editReply({
          components: [],
          content: "Confirmation not received within 1 minute, cancelling"
        });
      }
    }

    await interaction.member.roles.add(role);
    return interaction.editReply(
      `You have successfully claimed the ${role.name} role!`
    );
  }
};
