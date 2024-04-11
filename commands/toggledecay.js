const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
var stats = require("./../resources/stats.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("toggledecay")
    .setDescription("Toggle decay for the current server (owner only)"),
  async execute(interaction) {
    await interaction.client.application.fetch();
    if (
      interaction.user === interaction.client.application.owner ||
      interaction.user.id === (await interaction.guild.fetchOwner()).user.id
    ) {
      stats[interaction.guild.id]["allowDecay"] = stats[interaction.guild.id][
        "allowDecay"
      ]
        ? false
        : true;
      const statsString = JSON.stringify(stats);

      fs.writeFileSync("./resources/stats.json", statsString);

      return interaction.reply(
        `Toggled decay for guild ${interaction.guild.name} (decay is now ${
          stats[interaction.guild.id]["allowDecay"]
        }).`
      );
    }
  },
};
