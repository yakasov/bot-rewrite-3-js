"use strict";

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("insights")
    .setDescription("Show command usage"),
  execute(interaction) {
    interaction.reply(
      `\`\`\`\n${JSON.stringify(globalThis.insights, null, 4)}\`\`\``
    );
  },
};
