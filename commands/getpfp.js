"use strict";

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("getpfp")
    .setDescription("Get a user's (or your) profile picture")
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to get the profile picture of")
    ),
  async execute(interaction) {
    try {
      const user = interaction.options.getUser("user");
      const avatar = (user || interaction.user).displayAvatarURL({
        dynamic: true,
        size: 4096,
      });

      const embed = new EmbedBuilder()
        .setImage(avatar)
        .setAuthor({ name: interaction.member.displayName });
      await interaction.reply({ embeds: [embed] });
    } catch (e) {
      await interaction.reply(e.message);
    }
  },
};
