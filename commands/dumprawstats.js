const stats = require("./../resources/stats.json");

module.exports = {
  aliases: ["rawstats"],
  description: "Show raw statistics.",
  run: async (client, msg, args) => {
    const guildStats = stats[msg.guild.id];
    if (!guildStats) return;

    msg.reply("```json\n" + JSON.stringify(guildStats, null, 4) + "\n```");
  },
};
