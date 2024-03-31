const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  aliases: ["pong"],
  data: new SlashCommandBuilder().setName("ping").setDescription("Ping!"),
  async execute(interaction) {
    interaction.reply(`Pong! ${interaction.client.ws.ping}ms`);
  },
};
