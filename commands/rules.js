"use strict";

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("rules")
    .setDescription("The rules."),
  async execute(interaction) {
    const rules = await fetch("https://jmcd.uk/bot/getRules", {
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      },
      method: "GET"
    })
      .then((r) => r.json())
      .then((j) => j.data);

    let output = "";
    Object.entries(rules)
      .forEach(([k, v]) => {
        output += `**Rule ${k}**: ${v}.\n`;
      });
    interaction.reply(output);
  }
};
