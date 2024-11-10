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
let page = 1;
const cards = [];

async function generateBoosterPack() {
  const sets = (await Sets.all())
    .filter((s) => s.card_count > 100)
    .map((s) => ({ code: s.code, count: s.card_count, name: s.name }));

  const randomSet = sets[Math.floor(Math.random() * sets.length)];

  for (let _ = 0; _ < 12; _++) {
    const randomId = Math.floor(Math.random() * sets[0].count)
      .toString();
    const randomCard =
      cache[randomSet.code] && cache[randomSet.code][randomId]
        ? cache[randomSet.code][randomId]
        : await Cards.bySet(sets[0].code, randomId);

    // TODO: caching might be broken

    if (randomCard && randomCard.name) {
      if (!cache[randomSet.code]) {
        cache[randomSet.code] = {};
      }

      if (!cache[randomSet.code][randomCard.collector_number]) {
        cache[randomSet.code][randomCard.collector_number] = randomCard;
      }

      cards.push(randomCard);
    } else {
      _--;
    }
  }

  fs.writeFileSync("./resources/mtgCache.json", JSON.stringify(cache));
}

function getButtons() {
  const buttons = [
    new ButtonBuilder()
      .setCustomId("previousPage")
      .setLabel("Previous card")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 1),
    new ButtonBuilder()
      .setCustomId("nextPage")
      .setLabel("Next card")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 12),
  ];

  return new ActionRowBuilder()
    .addComponents(...buttons);
}

function getContent() {
  const c = cards[page - 1];

  return new EmbedBuilder()
    .setTitle(c.name)
    .setURL(c.scryfall_uri)
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
        value: replaceIcons(c.flavor_text),
      }
    )
    .setImage(c.image_uris.normal);
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
    .setName("mtg")
    .setDescription("Random card"),
  async execute(interaction) {
    await interaction.deferReply();
    await generateBoosterPack();

    const response = await interaction.editReply({
      components: [getButtons()],
      embeds: [getContent()],
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;
    const collector = response.createMessageComponentCollector({
      filter: collectorFilter,
      time: 60_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "nextPage") {
        page++;
      } else {
        page--;
      }

      await i.update({
        components: [getButtons()],
        embeds: [getContent()],
      });
    });
  },
};
