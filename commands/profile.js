/* eslint-disable indent */
const { statsConfig } = require("./../resources/config.json");
const stats = require("./../resources/stats.json");
const ranks = require("./../resources/ranks.json");

module.exports = {
  aliases: ["mystats"],
  description: "Show server statistics.",
  run: async (client, msg, args) => {
    const guildStats = stats[msg.guild.id];
    if (!guildStats) return msg.reply("This server has no statistics yet!");

    const specificUser = args[0]
      ? args[0].length == 18
        ? args[0]
        : args[0].match(/<@(.*)>/)
        ? args[0].match(/<@(.*)>/)[1]
        : null
      : null;
    if (specificUser) {
      if (specificUser.includes("&")) return; // Fix for roles being tagged
      if (!guildStats[specificUser])
        return msg.reply("This user has no statistics yet!");
    }

    const userStats = Object.entries(guildStats)
      .map(([k, v]) => {
        return [k, v["score"]];
      })
      .sort(function (f, s) {
        return s[1] - f[1];
      })
      .map((a, i) => [a[0], a[1], i])
      .filter((a) => a[0] == (specificUser ?? msg.author.id))[0];

    const allUserStats = guildStats[userStats[0]];
    const outputMessage = `=== Profile for ${module.exports.getNickname(
      msg,
      userStats[0]
    )}, #${userStats[2] + 1} on server ===\n    Messages: ${
      allUserStats["messages"]
    }\n    Voice Time: ${module.exports.formatTime(
      allUserStats["voiceTime"]
    )}\n\n    Ranking: ${module.exports.getRanking(allUserStats)} (${
      userStats[1]
    }SR)\n    Ranking before penalties: ${Math.floor(
      allUserStats["voiceTime"] * statsConfig["voiceChatSRGain"] +
        allUserStats["messages"] * statsConfig["messageSRGain"] +
        Math.max(
          0,
          (allUserStats["reputation"] ?? 0) * statsConfig["reputationGain"]
        )
    )}SR\n    Reputation: ${allUserStats["reputation"] ?? 0}\n    Decay: ${
      allUserStats["decay"]
    }\n\n    Nerd Emojis given: ${
      allUserStats["nerdsGiven"] ?? 0
    }\n    Nerd Emojis received: ${
      Object.values(allUserStats["nerdEmojis"]).reduce(
        (sum, a) => sum + a,
        0
      ) ?? 0
    }${!userStats[2] ? "\n    == #1 of friends! ==" : ""}\n\n`;

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
    return `${member.displayName}`;
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
