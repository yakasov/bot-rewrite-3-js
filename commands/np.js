const { ActivityType } = require("discord.js");
const fs = require("fs");
const splashes = fs.readFileSync("./resources/splashes.txt", "utf-8").split("\n");

exports.run = async (client, msg, args) => {    
    var splash = splashes[Math.floor(Math.random() * splashes.length)];
    client.user.setPresence({
      activities: [{ name: splash, type: ActivityType.Streaming }],
    });
    return splash;
}