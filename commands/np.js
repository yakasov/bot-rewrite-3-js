const { ActivityType } = require("discord.js");
const fs = require("fs");
const splashes = fs
  .readFileSync("./resources/splashes.txt", "utf-8")
  .split("\n");

module.exports = {
  aliases: [],
  description: "Generate a new splash presence",
  run: async (client, msg, args) => {
    var splash = splashes[Math.floor(Math.random() * splashes.length)];
    client.user.setPresence({
      activities: [{ name: splash, type: ActivityType.Watching }],
    });
    return splash;
  },
};
