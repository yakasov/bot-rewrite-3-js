const stats = require("./../resources/stats.json");

module.exports = {
  aliases: [],
  description: "Show server statistics.",
  run: async (client, msg, args) => {
    const guildStats = stats[msg.guild.id];
    var outputMessage = "";
    Object.keys(guildStats).forEach((k) => {
      outputMessage += `${module.exports.getNickname(msg, k)}:\n    Messages: ${
        guildStats[k]["messages"]
      }\n    Voice Time: ${guildStats[k]["voiceTime"]}s\n`;
    });
    msg.reply("```\n" + outputMessage + "\n```");
  },
  getNickname: (msg, id) => {
    const member = msg.guild.members.cache.filter((m) => m.id == id).first();
    return member.nickname ?? member.user.username;
  },
};
