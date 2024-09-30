"use strict";

const { ActionRowBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, SlashCommandBuilder } = require("discord.js");

function getOptions(names) {
  const returnArray = [];
  names.forEach((n) => {
    returnArray.push(
      new StringSelectMenuOptionBuilder()
        .setLabel(getStandardName(n))
        .setValue(n)
    );
  });
  return returnArray;
}

function getStandardName(name) {
  switch (name) {
  case "\u001b[30;000mBozo\u001b[0m":
  case "\u001b[30;000mBozo":
    return "Bozo";
  case "\u001b[00;000m:nerd:\u001b[0m":
  case "\u001b[00;000m:nerd:":
    return ":nerd";
  case "\u001b[32;000mChump\u001b[0m":
  case "\u001b[32;000mChump":
    return "Chump";
  case "\u001b[37;000mLiverpool Fan\u001b[0m":
  case "\u001b[37;000mLiverpool Fan":
    return "Liverpool Fan";
  case "\u001b[34;000mYoung Fly\u001b[0m":
  case "\u001b[34;000mYoung Fly":
    return "Young Fly";
  case "\u001b[36;000mPickleman\u001b[0m":
  case "\u001b[36;000mPickleman":
    return "Pickleman";
  case "\u001b[33;000mLooksmaxxer\u001b[0m":
  case "\u001b[33;000mLooksmaxxer":
    return "Looksmaxxer";
  case "\u001b[35;000mGoonmaxxer\u001b[0m":
  case "\u001b[35;000mGoonmaxxer":
    return "Goonmaxxer";
  case "\u001b[34;1;1mCaked-up\u001b[0m":
  case "\u001b[34;1;1mCaked-up":
    return "Caked-up";
  case "\u001b[37;1;1mDiscord Mod\u001b[0m":
  case "\u001b[37;1;1mDiscord Mod":
    return "Discord Mod";
  case "\u001b[35;1;1mLisan al-Gaib\u001b[0m":
  case "\u001b[35;1;1mLisan al-Gaib":
    return "Lisan al-Gaib";
  case "\u001b[31;1;4mTrue #1 of Friends\u001b[0m":
  case "\u001b[31;1;4mTrue #1 of Friends":
    return "True #1 of Friends";
  default:
    return name;
  }
}

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("title")
    .setDescription("Choose your title"),
  async execute(interaction) {
    await interaction.deferReply();
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const { unlockedNames } = globalThis.stats[guildId][userId];

    const select = new StringSelectMenuBuilder()
      .setCustomId("starter")
      .setPlaceholder("Make a selection!")
      .addOptions(
        ...getOptions(unlockedNames)
      );

    const response = await interaction.editReply({
      "components": [
        new ActionRowBuilder()
          .addComponents(select)
      ],
      "content": "Choose a name to use in /stats and /profile!"
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;
    const collector = response.createMessageComponentCollector({
      "filter": collectorFilter,
      "time": 60_000
    });

    collector.on("collect", async (i) => {
      // eslint-disable-next-line prefer-destructuring
      globalThis.stats[guildId][userId].name = i.values[0];
      globalThis.stats[guildId][userId].customSetName = true;

      await i.update({
        "components": [
          new ActionRowBuilder()
            .addComponents(select)
        ],
        "content": `Updated name to ${getStandardName(i.values[0])}`
      });
    });
  }
};
