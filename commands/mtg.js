"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");
const { Cards, Sets } = require("scryfall-api");
const fs = require("fs");
const cache = require("../resources/mtgCache.json");

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
  "{B}": ":blue_circle:",
  "{C}": ":grey_circle:",
  "{G}": ":green_circle:",
  "{R}": ":red_circle:",
  "{T}": ":arrow_right_hook:",
  "{U}": ":black_circle:",
  "{W}": ":white_circle:",
};
const interactions = {};

async function generateBoosterPack(id) {
  const sets = (await Sets.all())
    .filter((s) => s.card_count > 100)
    .map((s) => ({ code: s.code, count: s.card_count, name: s.name }));

  //Const randomSet = sets[Math.floor(Math.random() * sets.length)];
  const randomSet = sets[0];

  for (let _ = 0; _ < 12; _++) {
    const randomId = Math.floor(Math.random() * sets[0].count)
      .toString();
    const randomCard =
      cache[randomSet.code] && cache[randomSet.code][randomId]
        ? cache[randomSet.code][randomId]
        : await Cards.bySet(sets[0].code, randomId);

    if (randomCard && randomCard.name) {
      const convertedCard = convertForCache(randomCard);

      if (!cache[randomSet.code]) {
        cache[randomSet.code] = {};
      }

      if (!cache[randomSet.code][convertedCard.number]) {
        cache[randomSet.code][convertedCard.number] = convertedCard;
      }

      interactions[id].cards.push(convertedCard);
    } else {
      _--;
    }
  }

  fs.writeFileSync("./resources/mtgCache.json", JSON.stringify(cache));
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

  return new EmbedBuilder()
    .setTitle(c.name)
    .setURL(c.url)
    .setDescription(c.type_line)
    .addFields(
      {
        name: "Set",
        value: `${c.set_name} (${c.set})`
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
    .setImage(c.image);
}

function replaceIcons(text) {
  let returnText = text ?? "-";

  Object.entries(replacements)
    .forEach(([k, v]) => {
      returnText = returnText.replaceAll(k, v);
    });

  return returnText;
}

function convertForCache(card) {
  return {
    colours: card.colors,
    flavour_text: card.flavor_text,
    foil: card.foil,
    id: card.id,
    image: card.image_uris.normal,
    keywords: card.keywords,
    legal: card.legalities.commander === "legal",
    mana_cost: card.mana_cost,
    name: card.name,
    number: card.collector_number,
    oracle_text: card.oracle_text,
    power: card.power,
    price: card.foil ? card.prices.usd : card.prices.usd_foil,
    rarity: card.rarity,
    set: card.set,
    set_name: card.set_name,
    toughness: card.toughness,
    type_line: card.type_line,
    url: card.scryfall_uri
  };
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mtg")
    .setDescription("Random card"),
  async execute(interaction) {
    interactions[interaction.user.id] = {
      cards: [],
      page: 1
    };

    await interaction.deferReply();
    await generateBoosterPack(interaction.user.id);

    const response = await interaction.editReply({
      components: [getButtons(interaction.user.id)],
      embeds: [getContent(interaction.user.id)],
    });

    console.log(interactions[interaction.user.id].cards[0]);

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

      await i.update({
        components: [getButtons(interaction.user.id)],
        embeds: [getContent(interaction.user.id)],
      });
    });
  },
};
