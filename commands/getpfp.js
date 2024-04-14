"use strict";

const { EmbedBuilder, SlashCommandBuilder } = require("discord.js");

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("getpfp")
    .setDescription(
      "Get profile picture of mentioned user. If no user, use author"
    )
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to get the profile picture of")),
  async execute(interaction) {
    const user = interaction.options.getUser("user");

    try {
      let avatar = null;
      if (user) {
        avatar = user.displayAvatarURL({ "dynamic": true,
          "size": 1024 });
      } else {
        avatar = interaction.user.displayAvatarURL({
          "dynamic": true,
          "size": 1024
        });
      }

      const embed = new EmbedBuilder()
        .setImage(avatar)
        .setAuthor({ "name": interaction.member.displayName });
      await interaction.reply({ "embeds": [embed] });
    } catch (e) {
      await interaction.reply(e.message);
    }
  }
};
