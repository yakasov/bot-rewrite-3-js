"use strict";

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("daily")
    .setDescription("???"),
  execute(interaction) {
    return interaction;
  }
};
