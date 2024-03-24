const fs = require("fs");
const stats = require("./../resources/stats.json");

module.exports = {
  aliases: ["use_channel", "setchannel", "set_channel"],
  description: "Designates the channel to use for rank up messages",
  run: async ([client, msg, args]) => {
    await client.application.fetch();
    if (msg.author === client.application.owner) {
      try {
        const newVal = /^-?\d+$/.test(args[2]) ? parseInt(args[2]) : args[2];
        stats[msg.guild.id][args[0]][args[1]] =
          args[3] && args[3] == "add"
            ? stats[msg.guild.id][args[0]][args[1]] + newVal
            : newVal;
        fs.writeFileSync("./resources/stats.json", JSON.stringify(stats));

        return msg.reply(
          `Set user ${args[0]} attribute ${args[1]} to value ${
            stats[msg.guild.id][args[0]][args[1]]
          }`
        );
      } catch (e) {
        return msg.reply(e.message);
      }
    }
  },
};
