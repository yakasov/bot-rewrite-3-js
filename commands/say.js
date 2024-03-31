const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("say")
    .setDescription("Repeats any input given")
    .addStringOption((opt) =>
      opt
        .setName("message")
        .setDescription("The input to repeat")
        .setRequired(true)
    ),
  async execute(interaction) {
    const message = interaction.options.getString("message");

    await interaction.reply(message);
  },
};
