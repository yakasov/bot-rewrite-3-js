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
      }\n    Voice Time: ${module.exports.formatTime(
        guildStats[k]["voiceTime"]
      )}\n    Ranking: ${module.exports.getRanking(guildStats[k])}\n\n`;
    });

    msg.reply("```\n" + outputMessage + "\n```");
  },
  formatTime: (time) => {
    if (time == 0) return "0s";

    var units = { h: 0, m: 0, s: 0 };

    while (time >= 3600) {
      time -= 3600;
      units["h"] += 1;
    }

    while (time >= 60) {
      time -= 60;
      units["m"] += 1;
    }

    units["s"] = time; // for consistency

    // does this formatting method suck? yea
    // there is an easier way surely with Object.keys(units)
    // TODO: above
    return `${units["h"] ? units["h"] + "h " : ""}${
      units["m"] ? units["m"] + "m " : ""
    }${units["s"] ? units["s"] + "s " : ""}`;
  },
  getNickname: (msg, id) => {
    const member = msg.guild.members.cache.filter((m) => m.id == id).first();
    return member.nickname ?? member.user.username;
  },
  getRanking: (stats) => {
    return "...";
  },
};
