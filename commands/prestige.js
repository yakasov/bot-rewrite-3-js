/* eslint-disable indent */
const {
  ActionRowBuilder,
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const fs = require("fs");
const { statsConfig } = require("./../resources/config.json");
const stats = require("./../resources/stats.json");

module.exports = {
  aliases: ["rankup"],
  data: new SlashCommandBuilder()
    .setName("prestige")
    .setDescription("Prestige to the next prestige level."),
  async execute(interaction) {
    const guildStats = stats[interaction.guild.id];
    if (!guildStats)
      return await interaction.reply("This server has no statistics yet!");
    if (!guildStats[interaction.user.id])
      return await interaction.reply("You do not have any statistics yet!");
    if (
      (guildStats[interaction.user.id]["prestige"] ?? 0) >=
      statsConfig["prestigeMaximum"]
    )
      return await interaction.reply("You have reached max prestige!");
    if (
      guildStats[interaction.user.id]["score"] <
      statsConfig["prestigeRequirement"]
    )
      return await interaction.reply(
        `You cannot prestige until ${statsConfig["prestigeRequirement"]}SR!`
      );

    const select = new StringSelectMenuBuilder()
      .setCustomId("answer")
      .setPlaceholder("Are you sure you want to prestige?")
      .addOptions(
        new StringSelectMenuOptionBuilder().setLabel("Yes").setValue("y"),
        new StringSelectMenuOptionBuilder().setLabel("No").setValue("n")
      );

    const row = new ActionRowBuilder().addComponents(select);

    const response = await interaction.reply({
      content:
        "Prestiging will reset your SR back to 0, and your rank will be adjusted accordingly.\n\nIn return, you will gain a prestige mark and your SR gain will be boosted. Additionally, your +/-reps and reactions will have more weight.\n\nAre you sure you want to prestige?",
      components: [row],
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;

    try {
      const confirmation = await response.awaitMessageComponent({
        filter: collectorFilter,
        time: 60_000,
      });

      if (confirmation.customId == "y") {
        await confirmation.update({
          content: `${
            interaction.guild.members.cache
              .filter((m) => m.id == interaction.user.id)
              .first().displayName
          } has prestiged to prestige ${
            guildStats[interaction.user.id]["prestige"] + 1
          }!`,
          components: [],
        });

        stats[interaction.guild.id][interaction.user.id]["prestige"] =
          (stats[interaction.guild.id][interaction.user.id]["prestige"] ?? 0) +
          1;
        stats[interaction.guild.id][interaction.user.id]["bestRanking"] = "";
        stats[interaction.guild.id][interaction.user.id]["bestScore"] = 0;

        // Store message + voiceTime values then reset them
        stats[interaction.guild.id][interaction.user.id]["previousMessages"] =
          (stats[interaction.guild.id][interaction.user.id][
            "previousMessages"
          ] ?? 0) +
          stats[interaction.guild.id][interaction.user.id]["messages"];
        stats[interaction.guild.id][interaction.user.id]["previousVoiceTime"] =
          (stats[interaction.guild.id][interaction.user.id][
            "previousVoiceTime"
          ] ?? 0) +
          stats[interaction.guild.id][interaction.user.id]["voiceTime"];

        stats[interaction.guild.id][interaction.user.id]["messages"] = 0;
        stats[interaction.guild.id][interaction.user.id]["voiceTime"] = 0;

        fs.writeFileSync("./resources/stats.json", JSON.stringify(stats));
      } else {
        await confirmation.update({
          content: "Prestige cancelled",
          components: [],
        });
      }
    } catch (e) {
      await interaction.editReply({
        content: "Confirmation not received within 1 minute, cancelling",
        components: [],
      });
    }
  },
};
