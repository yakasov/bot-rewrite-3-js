const { status } = require("minecraft-server-util");
const {
  minecraftServerIp,
  minecraftServerPort,
  minecraftServerOwnerId,
} = require("./../resources/config.json");

exports.run = async (client, msg, args) => {
  if (!(minecraftServerIp.length && minecraftServerPort)) {
    return;
  }

  status(minecraftServerIp, minecraftServerPort)
    .then((res) => {
      msg.reply("```\n" + res + "\n```");
    })
    .catch((e) => {
      var str = e.message;

      if (e.errno && e.errno === -4078) {
        str += `\n<@${minecraftServerOwnerId}>`;
      }

      msg.reply(str);
    });
};
