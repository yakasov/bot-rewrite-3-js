"use strict";

const {
  ActionRowBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  SlashCommandBuilder,
} = require("discord.js");

/* eslint-disable sort-keys */
const STANDARD_NAMES = {
  "\u001b[30;000mBozo\u001b[0m": "Bozo",
  "\u001b[00;000m:nerd:\u001b[0m": ":nerd:",
  "\u001b[32;000mChump\u001b[0m": "Chump",
  "\u001b[37;000mLiverpool Fan\u001b[0m": "Liverpool Fan",
  "\u001b[34;000mYoung Fly\u001b[0m": "Young Fly",
  "\u001b[36;000mPickleman\u001b[0m": "Pickleman",
  "\u001b[33;000mLooksmaxxer\u001b[0m": "Looksmaxxer",
  "\u001b[35;000mGoonmaxxer\u001b[0m": "Goonmaxxer",
  "\u001b[34;1;1mCaked-up\u001b[0m": "Caked-up",
  "\u001b[37;1;1mDiscord Mod\u001b[0m": "Discord Mod",
  "\u001b[35;1;1mLisan al-Gaib\u001b[0m": "Lisan al-Gaib",
  "\u001b[31;1;4mTrue #1 of Friends\u001b[0m": "True #1 of Friends",
};
/* eslint-enable sort-keys */

function getStandardName(name) {
  return STANDARD_NAMES[name] || name;
}

function buildSelectOptions(names) {
  return names.map((n) =>
    new StringSelectMenuOptionBuilder().setLabel(getStandardName(n)).setValue(n)
  );
}

function buildSelectMenu(unlockedNames) {
  return new StringSelectMenuBuilder()
    .setCustomId("starter")
    .setPlaceholder("Make a selection!")
    .addOptions(...buildSelectOptions(unlockedNames));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("title")
    .setDescription("Choose your title"),
  async execute(interaction) {
    await interaction.deferReply();
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const { unlockedNames } = globalThis.stats[guildId][userId];

    const select = buildSelectMenu(unlockedNames);

    const response = await interaction.editReply({
      components: [new ActionRowBuilder().addComponents(select)],
      content: "Choose a name to use in /stats and /profile!",
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;
    const collector = response.createMessageComponentCollector({
      filter: collectorFilter,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      /* eslint-disable-next-line prefer-destructuring */
      globalThis.stats[guildId][userId].name = i.values[0];
      globalThis.stats[guildId][userId].customSetName = true;

      await i.update({
        components: [new ActionRowBuilder().addComponents(select)],
        content: `Updated name to ${getStandardName(i.values[0])}`,
      });
    });
  },
};
