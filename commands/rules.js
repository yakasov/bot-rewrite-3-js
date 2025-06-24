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

    const output = Object.entries(rules)
      .map(([ruleId, ruleValue]) => `**Rule ${ruleId}**: ${ruleValue}.`)
      .join("\n");
    interaction.reply(output);
  }
};
