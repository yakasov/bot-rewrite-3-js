const { statsConfig } = require("./../resources/config.json");
const stats = require("./../resources/stats.json");
const ranks = require("./../resources/ranks.json");

module.exports = {
  aliases: [],
  description: "Show server statistics.",
  run: async (client, msg, args) => {
    const guildStats = stats[msg.guild.id];
    if (!guildStats) {
      return msg.reply("This server has no statistics yet!");
    }
    var outputMessage = "";

    var sortedNerders = Object.entries(guildStats).map(([k, v]) => {
      return [k, v["nerdsGiven"] ?? 0];
    });
    sortedNerders.sort(function (f, s) {
      return s[1] - f[1];
    });

    outputMessage += `Top Nerder: ${module.exports.getNickname(
      msg,
      sortedNerders[0][0]
    )} - ${sortedNerders[0][1]} emojis given \n`;

    var sortedNerded = Object.entries(guildStats).map(([k, v]) => {
      return [
        k,
        Object.values(v["nerdEmojis"]).reduce((sum, a) => sum + a, 0) ?? 0,
      ];
    });
    sortedNerded.sort(function (f, s) {
      return s[1] - f[1];
    });

    outputMessage += `Most Nerded: ${module.exports.getNickname(
      msg,
      sortedNerded[0][0]
    )} - ${sortedNerded[0][1]} emojis received\n\n`;

    var sortedScores = Object.entries(guildStats).map(([k, v]) => {
      v["score"] = Math.max(
        0,
        Math.floor(
          v["voiceTime"] * statsConfig["voiceChatSRGain"] +
            v["messages"] * statsConfig["messageSRGain"] -
            Object.values(v["nerdEmojis"]).reduce(
              (sum, a) => sum + 2 ** a - 1,
              0
            ) -
            v["decay"]
        )
      );
      return [k, v["score"]];
    });
    sortedScores.sort(function (f, s) {
      return s[1] - f[1];
    });

    sortedScores.forEach((a, i) => {
      outputMessage += `#${i + 1}: ${module.exports.getNickname(
        msg,
        a[0],
        true
      )}\n    Messages: ${
        guildStats[a[0]]["messages"]
      }\n    Voice Time: ${module.exports.formatTime(
        guildStats[a[0]]["voiceTime"]
      )}\n    Ranking: ${module.exports.getRanking(guildStats[a[0]])} (${
        a[1]
      }SR)${!i ? "\n    == #1 of friends! ==" : ""}\n\n`;
    });

    const outputArray = outputMessage.match(/[\s\S]{1,1990}(?!\S)/g);
    outputArray.forEach((r) => {
      msg.reply("```ansi\n" + r + "\n```");
    });
  },
  formatTime: (seconds) => {
    var date = new Date(null);
    date.setSeconds(seconds);
    const unitArray = date.toISOString().substr(11, 8).split(":");
    return `${unitArray[0]}h ${unitArray[1]}m ${unitArray[2]}s`;
  },
  getNickname: (msg, id, arrow = false) => {
    const member = msg.guild.members.cache.filter((m) => m.id == id).first();
    return `${member.nickname ?? member.user.username}${
      msg.author.id == id && arrow ? "        <-----" : ""
    }`;
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
