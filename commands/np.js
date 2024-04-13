const { ActivityType, SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const splashes = fs
  .readFileSync("./resources/splashes.txt", "utf-8")
  .split("\n");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("np")
    .setDescription("Generate a new splash presence"),
  async execute(interaction) {
    const splash = splashes[Math.floor(Math.random() * splashes.length)];
    interaction.client.user.setPresence({
      activities: [{ name: splash, type: ActivityType.Watching }],
    });
    await interaction.reply(`Set splash to ${splash}!`);
    return splash;
  },
  run: async ([client]) => {
    const splash = splashes[Math.floor(Math.random() * splashes.length)];
    client.user.setPresence({
      activities: [{ name: splash, type: ActivityType.Watching }],
    });
    return splash;
  },
};
