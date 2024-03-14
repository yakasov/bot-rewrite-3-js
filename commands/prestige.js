/* eslint-disable indent */
const fs = require("fs");
const { statsConfig } = require("./../resources/config.json");
const stats = require("./../resources/stats.json");

module.exports = {
  aliases: ["rankup"],
  description: "Show server statistics.",
  run: async ([, msg]) => {
    const guildStats = stats[msg.guild.id];
    if (!guildStats) return msg.reply("This server has no statistics yet!");
    if (!guildStats[msg.author.id])
      return msg.reply("You do not have any statistics yet!");
    if (guildStats[msg.author.id]["score"] < statsConfig["prestigeRequirement"])
      return msg.reply(
        `You cannot prestige until ${statsConfig["prestigeRequirement"]}SR!`
      );

    msg
      .reply(
        "Prestiging will reset your SR back to 0, and your rank will be adjusted accordingly.\n\nIn return, you will gain a prestige mark and your SR gain will be boosted. Additionally, your +/-reps and reactions will have more weight.\n\nAre you sure you want to prestige?"
      )
      .then((m) => {
        m.react("✅").then(() => m.react("❌"));

        const collectorFilter = (reaction, user) => {
          return (
            ["✅", "❌"].includes(reaction.emoji.name) &&
            user.id === msg.author.id
          );
        };

        m.awaitReactions({
          filter: collectorFilter,
          max: 1,
          time: 60_000,
          errors: ["time"],
        })
          .then((collected) => {
            const reaction = collected.first();

            if (reaction.emoji.name == "❌") {
              m.delete();
              return msg.reply("Prestige cancelled.");
            } else {
              m.delete();
              msg.channel.send(
                `${
                  msg.guild.members.cache
                    .filter((m) => m.id == msg.author.id)
                    .first().displayName
                } has prestiged to prestige ${
                  guildStats[msg.author.id]["prestige"] + 1
                }!`
              );

              stats[msg.guild.id][msg.author.id]["prestige"] =
                (stats[msg.guild.id][msg.author.id]["prestige"] ?? 0) + 1;
              stats[msg.guild.id][msg.author.id]["bestRanking"] = "";
              stats[msg.guild.id][msg.author.id]["bestScore"] = 0;

              fs.writeFileSync("./resources/stats.json", JSON.stringify(stats));
            }
          })
          .catch(() => {
            return m.delete();
          });
      });
  },
};
