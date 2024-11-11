"use strict";

const fs = require("fs");
const { Cards } = require("scryfall-api");
const https = require("https");
const { joinImages } = require("join-images");
const cache = require("../resources/mtg/mtgCache.json");

async function getFullSet(set) {
  if (cache[set]) {
    return;
  } 
  cache[set] = [];

  const result = await Promise.all(
    (await Cards.search(`set:${set}`)
      .all())
      .map(async (c) => await convertForCache(c))
  );

  result.forEach((c) => {
    cache[set][c.number] = c;
  });

  fs.writeFileSync("./resources/mtg/mtgCache.json", JSON.stringify(cache));
}

function setFilter(rules) {
  /*
   * Rules will be a dictionary
   * e.g. { k: "type", v: "land" }
   * where all rules will be iterated through
   */
}

async function convertForCache(card) {
  if (card.flavour_text) {
    /*
     * TODO: Make this check less... hacky
     * This check stops cards being converted if they're already cached
     * (because a non-cache card won't have 'flavour' text)
     *
     * This can properly be mitigated by checking it when called
     */
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
    canBeFoil: card.foil,
    colours: card.colors ?? card.card_faces[0].colors,
    flavour_text: card.flavor_text,
    foil: false,
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
    price_foil: card.prices.usd_foil,
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
  /*
   * Only required when a card is reversible
   * Then we need to download the cards to merge them
   * Otherwise it makes more sense to give the image URL to Discord
   */
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
  // For deleting merge image parts
  filePaths.forEach((filePath) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Failed to delete ${filePath}:`, err);
      }
    });
  });
}

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function lucky(i) {
  return Math.random() <= i / 100;
}

module.exports = {
  boosterGetConnected(set) {
    const chances = [
      { chance: 35, common: 5, uncommon: 1 },
      { chance: 75, common: 4, uncommon: 2 },
      { chance: 87.5, common: 3, uncommon: 3 },
      { chance: 94.5, common: 2, uncommon: 4 },
      { chance: 98, common: 1, uncommon: 5 },
      { chance: 100, common: 0, uncommon: 6 }
    ];
    const roll = Math.random() * 100;
    const cardsToPull = chances.find(({ chance }) => roll < chance).result;
  },
  boosterGetHeadTurning(set) {},
  async boosterGetLand(set) {
    const isFoil = lucky(15);
    const cards = await searchHelper(set.code, "land", isFoil ? "is:foil" : "");
    const card = getRandom(cards);
    card.foil = isFoil;

    return card;
  },
  boosterGetMythic(set) {},
  boosterGetRare(set) {},
  boosterGetWildCard(set) {},
  getFullSet
};
