"use strict";

const { SlashCommandBuilder } = require("discord.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("rules")
    .setDescription("The rules."),
  async execute(interaction) {
    const rules = await fetch("https://jmcd.uk/bot/getRules", {
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      },
      method: "GET"
    })
      .then((response) => response.json())
      .then((json) => json.data);

    let output = "";
    Object.entries(rules)
      .forEach(([ruleId, ruleValue]) => {
        output += `**Rule ${ruleId}**: ${ruleValue}.\n`;
      });
    interaction.reply(output);
  }
};
