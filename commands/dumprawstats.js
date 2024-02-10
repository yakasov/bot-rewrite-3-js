const stats = require("./../resources/stats.json");

module.exports = {
  aliases: ["rawstats"],
  description: "Show raw statistics.",
  run: async (client, msg, args) => {
    const guildStats = stats[msg.guild.id];
    if (!guildStats) return;

    const outputArray = JSON.stringify(guildStats, null, 4).match(
      /[\s\S]{1,1986}(?!\S)/g
    );
    outputArray.forEach((r) => {
      msg.reply("```json\n" + r + "\n```");
    });
  },
};
