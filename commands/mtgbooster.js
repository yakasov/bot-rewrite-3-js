"use strict";

const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");
const { allSets } = require("../resources/mtg/mtgSets.js");
const cache = require("../resources/mtg/mtgCache.json");
const cardCache = require("../resources/mtg/mtgCards.json");
const { MTG_PACK_SIZE } = require("../util/consts.js");
const { getButtons, getContent } = require("../util/mtg/boosterUI.js");
const {
  getFullSet,
  getRandom,
  setFilter,
} = require("../util/mtg/boosterHelper.js");
const {
  boosterGetConnected,
  boosterGetFoil,
  boosterGetHeadTurning,
  boosterGetLand,
  boosterGetRareOrMythic,
  boosterGetWildCard,
} = require("../util/mtg/boosterGenerator.js");

const interactions = {};

async function generateBoosterPack(interaction, chosenSet = null) {
  if (chosenSet && !allSets.find((s) => s.code === chosenSet)) {
    return true;
  }

  const { id } = interaction.user;
  const setToUse =
    allSets.find((s) => s.code === chosenSet) ||
    allSets[Math.floor(Math.random() * allSets.length)];

  if (!cache[setToUse.code]) {
    interaction.editReply(
      `Fetching ${setToUse.count} cards for set ${setToUse.name} (${setToUse.code})...`
    );
    await getFullSet(setToUse.code);
    interaction.editReply(`Created cache for ${setToUse.name}.`);
  }

  interactions[id].cards = [
    boosterGetLand(setToUse),
    ...boosterGetConnected(setToUse),
    boosterGetHeadTurning(setToUse),
    ...boosterGetWildCard(setToUse),
    boosterGetRareOrMythic(setToUse),
    boosterGetFoil(setToUse),
  ].filter((c) => c !== undefined);

  // If we couldn't filter the cards properly, fill with random cards
  for (let _ = interactions[id].cards.length; _ < MTG_PACK_SIZE; _++) {
    interactions[id].cards.push(getRandom(setFilter(setToUse.code, [])));

    if (!interactions[id].cardFill) {
      interactions[id].cardFill = _;
    }
  }

  if (!cardCache[id]) {
    cardCache[id] = { netWorth: 0 };
  }

  if (!cardCache[id][setToUse.code]) {
    cardCache[id][setToUse.code] = [];
  }

  interactions[id].cards.forEach((c) => {
    if (!cardCache[id][setToUse.code].includes(c.id)) {
      cardCache[id][setToUse.code].push(c.id);
    }
  });

  interactions[id].overallPrice = Math.round(
    (interactions[id].cards.reduce(
      (partial, ca) =>
        partial + parseFloat((ca.foil ? ca.price_foil : ca.price) ?? 0),
      0
    ) *
      100) /
      100
  );
  const setPrice = setToUse.price;
  const cardValue = interactions[id].overallPrice;
  cardCache[id].netWorth += cardValue - setPrice;

  fs.writeFileSync("./resources/mtg/mtgCards.json", JSON.stringify(cardCache));
  return false;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mtgbooster")
    .setDescription("Random card")
    .addStringOption((opt) =>
      opt
        .setName("set")
        .setDescription("Which set to pull cards from (leave blank for random)")
    ),
  async execute(interaction) {
    interactions[interaction.user.id] = {
      cards: [],
      page: 1,
    };
    const chosenSet = interaction.options.getString("set") ?? null;

    await interaction.deferReply();
    const shouldSkip = await generateBoosterPack(interaction, chosenSet);
    if (shouldSkip) {
      return interaction.editReply("Chosen set not found!");
    }

    let [embed, file] = getContent(interactions, interaction.user.id);
    const response = await interaction.editReply({
      components: [getButtons(interactions, interaction.user.id)],
      embeds: [embed],
      files: file ? [file] : [],
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;
    const collector = response.createMessageComponentCollector({
      filter: collectorFilter,
      idle: 300_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "nextPage") {
        if (interactions[i.user.id].page === MTG_PACK_SIZE + 1) {
          interactions[i.user.id].page = 1;
        } else {
          interactions[i.user.id].page++;
        }
      } else {
        interactions[i.user.id].page--;
      }

      [embed, file] = getContent(interactions, interaction.user.id);
      await i.update({
        components: [getButtons(interactions, interaction.user.id)],
        embeds: [embed],
        files: file ? [file] : [],
      });
    });

    return null;
  },
};
