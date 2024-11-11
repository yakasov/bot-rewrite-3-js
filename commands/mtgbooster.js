"use strict";

const {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");
const fs = require("fs");
const { Cards } = require("scryfall-api");
const {
  boosterGetConnected,
  boosterGetHeadTurning,
  boosterGetLand,
  boosterGetMythic,
  boosterGetRare,
  boosterGetWildCard,
  getFullSet
} = require("../util/mtgBoosterHelper.js");
const cache = require("../resources/mtg/mtgCache.json");
const { allSets } = require("../resources/mtg/mtgSets.js");

const replacements = {
  "{1}": ":one:",
  "{2}": ":two:",
  "{3}": ":three:",
  "{4}": ":four:",
  "{5}": ":five:",
  "{6}": ":six:",
  "{7}": ":seven:",
  "{8}": ":eight:",
  "{9}": ":nine:",
  "{B}": ":cold_face",
  "{C}": ":nerd:",
  "{G}": ":nauseated:",
  "{R}": ":rage:",
  "{T}": ":arrow_right_hook:",
  "{U}": ":new_moon_with_face:",
  "{W}": ":alien:",
  "{X}": ":regional_indicator_x:",
};
const interactions = {};

async function generateBoosterPack(id, chosenSet = null) {
  const setToUse = allSets.find((s) => s.code === chosenSet) 
              || allSets[Math.floor(Math.random() * allSets.length)];
  await getFullSet(setToUse);

  interactions[id].cards = [
    await boosterGetLand(setToUse),
    ...boosterGetConnected(setToUse),
    boosterGetHeadTurning(setToUse),
    ...boosterGetWildCard(setToUse),
    boosterGetRare(setToUse),
    boosterGetMythic(setToUse),   
  ];
  return;

  for (let _ = 0; _ < 12; _++) {
    const randomId = Math.floor(Math.random() * setToUse.count)
      .toString();
    const randomCard =
      cache[setToUse.code] && cache[setToUse.code][randomId]
        ? cache[setToUse.code][randomId]
        : await Cards.bySet(setToUse.code, randomId);

    /*
     * TODO: Refine this check further
     * Checking legalities is weird and arbitrary
     */
    if (randomCard && randomCard.name && randomCard.legalities) {
      const convertedCard = await convertForCache(randomCard);

      if (!cache[setToUse.code]) {
        cache[setToUse.code] = {};
      }

      if (!cache[setToUse.code][convertedCard.number]) {
        cache[setToUse.code][convertedCard.number] = convertedCard;
      }

      interactions[id].cards.push(convertedCard);
    } else {
      _--;
    }
  }

  fs.writeFileSync("./resources/mtg/mtgCache.json", JSON.stringify(cache));
}

function getButtons(id) {
  const buttons = [
    new ButtonBuilder()
      .setCustomId("previousPage")
      .setLabel("Previous card")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(interactions[id].page === 1),
    new ButtonBuilder()
      .setCustomId("nextPage")
      .setLabel("Next card")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(interactions[id].page === 12),
  ];

  return new ActionRowBuilder()
    .addComponents(...buttons);
}

function getContent(id) {
  const c = interactions[id].cards[interactions[id].page - 1];

  try {
    const file = c.local ? new AttachmentBuilder(`${c.image}.jpg`) : null;
    return [
      new EmbedBuilder()
        .setTitle(c.name)
        .setURL(c.url)
        .setDescription(c.type_line)
        .addFields(
          {
            name: "Set",
            value: `${c.set_name} (${c.set})`,
          },
          {
            name: "Oracle text",
            value: replaceIcons(c.oracle_text),
          },
          {
            name: "Flavour text",
            value: replaceIcons(c.flavour_text),
          }
        )
        .setImage(
          c.local ? `attachment://${c.image.split("/")
            .pop()}.jpg` : c.image
        ),
      file,
    ];
  } catch (e) {
    console.log(e);
    console.log(c);
  }

  return null;
}

function replaceIcons(text) {
  let returnText = text ?? "-";

  Object.entries(replacements)
    .forEach(([k, v]) => {
      returnText = returnText.replaceAll(k, v);
    });

  return returnText;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mtgbooster")
    .setDescription("Random card")
    .addStringOption((opt) =>
      opt
        .setName("set")
        .setDescription("Which set to pull cards from (leave blank for random)")),
  async execute(interaction) {
    interactions[interaction.user.id] = {
      cards: [],
      page: 1,
    };
    const chosenSet = interaction.options.getString("set") ?? null;

    await interaction.deferReply();
    await generateBoosterPack(interaction.user.id, chosenSet);

    let [embed, file] = getContent(interaction.user.id);
    const response = await interaction.editReply({
      components: [getButtons(interaction.user.id)],
      embeds: [embed],
      files: file ? [file] : [],
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;
    const collector = response.createMessageComponentCollector({
      filter: collectorFilter,
      time: 120_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "nextPage") {
        interactions[i.user.id].page++;
      } else {
        interactions[i.user.id].page--;
      }

      [embed, file] = getContent(interaction.user.id);
      await i.update({
        components: [getButtons(interaction.user.id)],
        embeds: [embed],
        files: file ? [file] : [],
      });
    });
  },
};
