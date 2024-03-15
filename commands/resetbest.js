const fs = require("fs");
const stats = require("./../resources/stats.json");
const ranks = require("./../resources/ranks.json");

module.exports = {
  aliases: ["use_channel", "setchannel", "set_channel"],
  description: "Designates the channel to use for rank up messages",
  run: async ([client, msg]) => {
    await client.application.fetch();
    if (msg.author === client.application.owner) {
      Object.keys(stats[msg.guild.id])
        .filter((k) => k.length == 18)
        .forEach((m) => {
          stats[msg.guild.id][m]["bestScore"] = stats[msg.guild.id][m]["score"];
          stats[msg.guild.id][m]["bestRanking"] = module.exports.getRanking(
            stats[msg.guild.id][m]
          );
        });

      fs.writeFileSync("./resources/stats.json", JSON.stringify(stats));
      return msg.reply(
        `Reset all best scores and rankings for guild ${msg.guild.id}.`
      );
    }
  },
  getRanking: (memberStats) => {
    var rankString = "MISSINGNO";
    Object.entries(ranks).forEach(([k, v]) => {
      if (v[0] <= memberStats["score"]) {
        rankString = `${v[1]}${k}\u001b[0m`;
      }
    });
    return rankString;
  },
};
