const { status } = require("minecraft-server-util");
const {
  minecraftServerIp,
  minecraftServerPort,
  minecraftServerOwnerId,
} = require("./../resources/config.json");

module.exports = {
  aliases: [],
  description: "Get information about the current Minecraft server",
  run: async ([, msg]) => {
    if (!(minecraftServerIp.length && minecraftServerPort)) {
      return;
    }

    status(minecraftServerIp, minecraftServerPort)
      .then((res) => {
        res.favicon = null; // favicon is a base64 encoded image, remove it
        msg.reply("```\n" + JSON.stringify(res, null, 4) + "\n```");
      })
      .catch((e) => {
        var str = e.message;

        if (e.errno && e.errno === -4078) {
          str += `\n<@${minecraftServerOwnerId}>`;
        }

        msg.reply(str);
      });
  },
};
