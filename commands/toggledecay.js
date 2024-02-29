const fs = require("fs");
var stats = require("./../resources/stats.json");

module.exports = {
  aliases: [],
  description: "Toggle decay for the current server (owner only)",
  run: async (client, msg, args) => {
    await client.application.fetch();
    if (msg.author === client.application.owner) {
      stats[msg.guild.id]["allowDecay"] = stats[msg.guild.id]["allowDecay"]
        ? false
        : true;
      const statsString = JSON.stringify(stats);

      fs.writeFileSync("./resources/stats.json", statsString);

      return msg.reply(
        `Toggled decay for guild ${msg.guild.name} (decay is now ${
          stats[msg.guild.id]["allowDecay"]
        }).`
      );
    }
  },
};
