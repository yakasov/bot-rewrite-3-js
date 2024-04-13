/* eslint-disable indent */
const {
  ActionRowBuilder,
  SlashCommandBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const fs = require("fs");
const { statsConfig } = require("./../resources/config.json");
const stats = require("./../resources/stats.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("prestige")
    .setDescription("Prestige to the next prestige level.")
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to force prestige (admin only)")
    ),
  async execute(interaction) {
    await interaction.client.application.fetch();

    const user = interaction.options.getUser("user");
    const elevated =
      interaction.user === interaction.client.application.owner ||
      interaction.user.id === (await interaction.guild.fetchOwner()).user.id;
    const idToUse = elevated && user ? user.id : interaction.user.id;

    const guildStats = stats[interaction.guild.id];
    if (!guildStats)
      return await interaction.reply("This server has no statistics yet!");
    if (!guildStats[idToUse])
      return await interaction.reply("You do not have any statistics yet!");

    if (!(elevated && user)) {
      if (
        (guildStats[idToUse]["prestige"] ?? 0) >= statsConfig["prestigeMaximum"]
      )
        return await interaction.reply("You have reached max prestige!");
      if (guildStats[idToUse]["score"] < statsConfig["prestigeRequirement"])
        return await interaction.reply(
          `You cannot prestige until ${statsConfig["prestigeRequirement"]}SR!`
        );
    }

    const confirm = new ButtonBuilder()
      .setCustomId("y")
      .setLabel("Yes")
      .setStyle(ButtonStyle.Success);

    const cancel = new ButtonBuilder()
      .setCustomId("n")
      .setLabel("No")
      .setStyle(ButtonStyle.Danger);

    const row = new ActionRowBuilder().addComponents(confirm, cancel);

    const response = await interaction.reply({
      content:
        "Prestiging will reset your SR back to 0, and your rank will be adjusted accordingly.\n\nIn return, you will gain a prestige mark and your SR gain will be boosted. Additionally, your +/-reps and reactions will have more weight.\n\nAre you sure you want to prestige?",
      components: [row],
    });

    const collectorFilter = (i) => elevated || i.user.id === idToUse;

    try {
      const confirmation = await response.awaitMessageComponent({
        filter: collectorFilter,
        time: 60_000,
      });

      if (confirmation.customId == "y") {
        await confirmation.update({
          content: `${
            interaction.guild.members.cache
              .filter((m) => m.id == idToUse)
              .first().displayName
          } has prestiged to prestige ${guildStats[idToUse]["prestige"] + 1}!`,
          components: [],
        });

        stats[interaction.guild.id][idToUse]["prestige"] =
          (stats[interaction.guild.id][idToUse]["prestige"] ?? 0) + 1;
        stats[interaction.guild.id][idToUse]["bestRanking"] = "";
        stats[interaction.guild.id][idToUse]["bestScore"] = 0;

        // Store message + voiceTime values then reset them
        stats[interaction.guild.id][idToUse]["previousMessages"] =
          (stats[interaction.guild.id][idToUse]["previousMessages"] ?? 0) +
          stats[interaction.guild.id][idToUse]["messages"];
        stats[interaction.guild.id][idToUse]["previousVoiceTime"] =
          (stats[interaction.guild.id][idToUse]["previousVoiceTime"] ?? 0) +
          stats[interaction.guild.id][idToUse]["voiceTime"];

        // Add nerdHandicap to offset nerdScore
        stats[interaction.guild.id][idToUse]["nerdHandicap"] =
          stats[interaction.guild.id][idToUse]["nerdScore"] **
            (stats[interaction.guild.id][idToUse]["prestige"] == 1 ? 1.55 : 0) *
          0.8;

        // Reset decay
        stats[interaction.guild.id][idToUse]["decay"] = 0;

        stats[interaction.guild.id][idToUse]["messages"] = 0;
        stats[interaction.guild.id][idToUse]["voiceTime"] = 0;

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
