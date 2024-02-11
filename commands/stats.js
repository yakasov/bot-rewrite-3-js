/* eslint-disable indent */
const { statsConfig } = require("./../resources/config.json");
const stats = require("./../resources/stats.json");
const ranks = require("./../resources/ranks.json");

module.exports = {
  aliases: ["statistics", "leaderboard", "scores"],
  description: "Show server statistics.",
  run: async (client, msg, args, start = 0) => {
    // 'start' is the start index of the scores to show
    // this is in case I let people scroll the leaderboard later
    // otherwise it works as top 5

    const guildStats = stats[msg.guild.id];
    if (!guildStats) return msg.reply("This server has no statistics yet!");

    const topNerder = Object.entries(guildStats)
      .map(([k, v]) => {
        return [k, v["nerdsGiven"] ?? 0];
      })
      .sort(function (f, s) {
        return s[1] - f[1];
      })[0];

    const topNerded = Object.entries(guildStats)
      .map(([k, v]) => {
        return [
          k,
          Object.values(v["nerdEmojis"]).reduce((sum, a) => sum + a, 0) ?? 0,
        ];
      })
      .sort(function (f, s) {
        return s[1] - f[1];
      })[0];

    const topScores = Object.entries(guildStats)
      .map(([k, v]) => {
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
      })
      .sort(function (f, s) {
        return s[1] - f[1];
      });

    var outputMessage = `Top Nerder: ${module.exports.getNickname(
      msg,
      topNerder[0]
    )} - ${
      topNerder[1]
    } emojis given\nMost Nerded: ${module.exports.getNickname(
      msg,
      topNerded[0]
    )} - ${topNerded[1]} emojis received\n\n`;

    topScores
      .slice(start, Math.min(start + 5, topScores.length))
      .forEach((a, i) => {
        outputMessage += `#${i + 1}: ${module.exports.getNickname(
          msg,
          a[0]
        )}\n    Messages: ${
          guildStats[a[0]]["messages"]
        }\n    Voice Time: ${module.exports.formatTime(
          guildStats[a[0]]["voiceTime"]
        )}\n    Ranking: ${module.exports.getRanking(guildStats[a[0]])} (${
          a[1]
        }SR)${!i ? "\n    == #1 of friends! ==" : ""}\n\n`;
      });

    const userRanking = topScores
      .map((a, i) => [a[0], a[1], i])
      .filter((a) => a[0] == msg.author.id)[0];
    outputMessage += `\nYour ranking (${module.exports.getNickname(
      msg,
      userRanking[0]
    )}): #${userRanking[2] + 1}`;

    const outputArray = outputMessage.match(/[\s\S]{1,1990}(?!\S)/g);
    outputArray.forEach((r) => {
      msg.reply("```ansi\n" + r + "\n```");
    });
  },
  formatTime: (seconds) => {
    // note: this will only work up to 30d 23h 59m 59s
    // this is because toISOString() returns 1970-01-01T03:12:49.000Z (eg)
    // if anybody hits this, gold star - 11/02/24
    var date = new Date(null);
    date.setSeconds(seconds);
    const unitArray = date.toISOString().substr(8, 11).split(/:|T/);
    return `${parseInt(unitArray[0]) - 1}d ${unitArray[1]}h ${unitArray[2]}m ${
      unitArray[3]
    }s`;
  },
  getNickname: (msg, id) => {
    const member = msg.guild.members.cache.filter((m) => m.id == id).first();
    return `${member.nickname ?? member.user.username}`;
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
