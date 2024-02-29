const fs = require("fs");
var stats = require("./../resources/stats.json");

module.exports = {
  aliases: ["use_channel", "setchannel", "set_channel"],
  description: "Designates the channel to use for rank up messages",
  run: async (client, msg, args) => {
    await client.application.fetch();
    if (msg.author === client.application.owner) {
      stats[msg.guild.id]["rankUpChannel"] = msg.channel.id;

      fs.writeFileSync("./resources/stats.json", JSON.stringify(stats));

      return msg.reply(`Set the rank up channel to ${msg.channel.name}.`);
    }
  },
};
