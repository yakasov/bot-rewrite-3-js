const fs = require("fs");
const channels = require("./../resources/channels.json");

module.exports = {
  aliases: ["use_channel", "setchannel", "set_channel"],
  description: "Designates the channel to use for rank up messages",
  run: async ([client, msg]) => {
    await client.application.fetch();
    if (msg.author === client.application.owner) {
      channels[msg.guild.id] = msg.channel.id;

      fs.writeFileSync("./resources/channels.json", JSON.stringify(channels));

      return msg.reply(`Set the rank up channel to ${msg.channel.name}.`);
    }
  },
};
