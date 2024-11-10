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
const https = require("https");
const { joinImages } = require("join-images");
const { Cards } = require("scryfall-api");
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
  "{B}": ":blue_circle:",
  "{C}": ":grey_circle:",
  "{G}": ":green_circle:",
  "{R}": ":red_circle:",
  "{T}": ":arrow_right_hook:",
  "{U}": ":black_circle:",
  "{W}": ":white_circle:",
};
const interactions = {};

async function generateBoosterPack(id, chosenSet) {
  let setToUse = null;

  if (chosenSet) {
    [setToUse] = allSets.filter((s) => s.code === chosenSet);
  }
  if (!setToUse) {
    setToUse = allSets[Math.floor(Math.random() * allSets.length)];
  }

  for (let _ = 0; _ < 12; _++) {
    const randomId = Math.floor(Math.random() * setToUse.count)
      .toString();
    const randomCard =
      cache[setToUse.code] && cache[setToUse.code][randomId]
        ? cache[setToUse.code][randomId]
        : await Cards.bySet(setToUse.code, randomId);

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

async function convertForCache(card) {
  if (card.flavour_text) {
    // Already converted... actually fix this issue above at some point (TODO)
    return card;
  }

  let image = null;
  let local = false;
  if (card.image_uris) {
    image = card.image_uris.normal;
  } else {
    image = await combineImages(card);
    local = true;
  }

  return {
    colours: card.colors ?? card.card_faces[0].colors,
    flavour_text: card.flavor_text,
    id: card.id,
    image,
    keywords: card.keywords,
    legal: card.legalities.commander === "legal",
    local,
    mana_cost: card.mana_cost ?? card.card_faces[0].mana_cost,
    name: card.name ?? card.card_faces[0].name,
    number: card.collector_number,
    oracle_text: card.oracle_text ?? card.card_faces[0].mana_cost,
    power: card.power,
    price: card.prices.usd,
    rarity: card.rarity,
    set: card.set,
    set_name: card.set_name,
    toughness: card.toughness,
    type_line: card.type_line ?? card.card_faces[0].type_line,
    url: card.scryfall_uri,
  };
}

async function combineImages(card) {
  const baseFilePath = `./resources/mtg/images/${card.id}`;

  const filePaths = await Promise.all([
    downloadImage(card, 0, baseFilePath),
    downloadImage(card, 1, baseFilePath),
  ]);
  const img = await joinImages(filePaths, { direction: "horizontal" });
  await img.toFile(`${baseFilePath}.jpg`);

  deleteFiles(filePaths);
  return baseFilePath;
}

function downloadImage(card, i, filePath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(`${filePath}-part${i}`);
    https
      .get(card.card_faces[i].image_uris.normal, (res) => {
        res.pipe(file);

        file.on("finish", () => {
          file.close(() => resolve(`${filePath}-part${i}`));
        });

        // If file fails to download for whatever reason, handle it gracefully
        file.on("error", (err) => {
          fs.unlink(`${filePath}-part${i}`, () => reject(err));
        });
      })
      .on("error", (err) => {
        reject(err);
      });
  });
}

function deleteFiles(filePaths) {
  filePaths.forEach((filePath) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Failed to delete ${filePath}:`, err);
      }
    });
  });
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
