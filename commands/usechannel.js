const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const stats = require("./../resources/stats.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("usechannel")
    .setDescription("Designates the channel to use for rank up messages"),
  async execute(interaction) {
    await interaction.client.application.fetch();
    if (
      interaction.user === interaction.client.application.owner ||
      interaction.user.id === (await interaction.guild.fetchOwner()).user.id
    ) {
      stats[interaction.guild.id].rankUpChannel = interaction.channel.id;

      fs.writeFileSync("./resources/stats.json", JSON.stringify(stats));

      return interaction.reply(
        `Set the rank up channel to ${interaction.channel.name}.`
      );
    }
  },
};
