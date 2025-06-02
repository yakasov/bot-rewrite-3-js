"use strict";

const { ActivityType, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

const splashes = fs
  .readFileSync("./resources/splashes.txt", "utf-8")
  .split("\n")
  .map((s) => s.trim())
  .filter(Boolean);

function getRandomSplash() {
  return splashes[Math.floor(Math.random() * splashes.length)];
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("np")
    .setDescription("Generate a new splash presence"),
  async execute(interaction) {
    const splash = getRandomSplash();
    await interaction.client.user.setPresence({
      activities: [{ name: splash, type: ActivityType.Watching }]
    });
    await interaction.reply(`Set splash to: ${splash}`);
    return splash;
  },
  run: ([client]) => {
    const splash = getRandomSplash();
    client.user.setPresence({
      activities: [{ name: splash, type: ActivityType.Watching }]
    });
    return splash;
  }
};
