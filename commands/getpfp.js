"use strict";

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("getpfp")
    .setDescription(
      "Get your, or a user's, profile picture"
    )
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to get the profile picture of")),
  async execute(interaction) {
    const user = interaction.options.getUser("user");

    try {
      let avatar = (user || interaction.user).displayAvatarURL({
          "dynamic": true,
          "size": 1024
        });

      const embed = new EmbedBuilder()
        .setImage(avatar)
        .setAuthor({ "name": interaction.member.displayName });
      await interaction.reply({ "embeds": [embed] });
    } catch (e) {
      await interaction.reply(e.message);
    }
  }
};
