const { statsConfig } = require("./../resources/config.json");
const stats = require("./../resources/stats.json");
const ranks = require("./../resources/ranks.json");

module.exports = {
  aliases: [],
  description: "Show server statistics.",
  run: async (client, msg, args) => {
    const guildStats = stats[msg.guild.id];
    if (!guildStats) {
      msg.reply("This server has no statistics yet!");
      return;
    }
    var outputMessage = "";

    var sortedScores = Object.entries(guildStats).map(([k, v]) => {
      v["score"] = Math.max(
        0,
        v["voiceTime"] +
          v["messages"] * statsConfig["messageSRGain"] -
          Object.values(v["nerdEmojis"]).reduce(
            (sum, a) => sum + 2 ** a - 1,
            0
          ) -
          v["decay"]
      );
      return [k, v["score"]];
    });
    sortedScores.sort(function (f, s) {
      return s[1] - f[1];
    });

    sortedScores.forEach((a, i) => {
      outputMessage += `#${i + 1}: ${module.exports.getNickname(
        msg,
        a[0]
      )}\n    Messages: ${
        guildStats[a[0]]["messages"]
      }\n    Voice Time: ${module.exports.formatTime(
        guildStats[a[0]]["voiceTime"]
      )}\n    Ranking: ${module.exports.getRanking(guildStats[a[0]])} (${
        a[1]
      }SR)\n\n`;
    });

    const outputArray = outputMessage.match(/[\s\S]{1,1990}(?!\S)/g);
    outputArray.forEach((r) => {
      msg.reply("```\n" + r + "\n```");
    });
  },
  formatTime: (seconds) => {
    var date = new Date(null);
    date.setSeconds(seconds);
    const unitArray = date.toISOString().substr(11, 8).split(":");
    return `${unitArray[0]}h ${unitArray[1]}m ${unitArray[2]}s`;
  },
  getNickname: (msg, id) => {
    const member = msg.guild.members.cache.filter((m) => m.id == id).first();
    return `${member.nickname ?? member.user.username}${
      msg.author.id == id ? "        <-----" : ""
    }`;
  },
  getRanking: (memberStats) => {
    var bestRank;
    Object.entries(ranks).forEach(([k, v]) => {
      if (v < memberStats["score"]) {
        bestRank = k;
      }
    });
    return bestRank;
  },
};
