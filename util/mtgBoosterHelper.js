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
  cache[set] = {};

  const result = await Promise.all(
    await Cards.search(`set:${set} unique:prints`)
      .all()
      .then((res) => res.map(async (c) => await convertForCache(c)))
  );

  result.forEach((c) => {
    // Investigate why c would be null
    if (c && !c.type_line.includes("Token")) {
      cache[set][c.number] = c;
    }
  });

  fs.writeFileSync("./resources/mtg/mtgCache.json", JSON.stringify(cache));
}

function setFilter(set, rules) {
  /*
   * Rules will be a dictionary
   * e.g.
   * { k: "type", t: "includes", v: "land" },
   * { k: "is", t: "is", v: isFoil ? "foil" : "nonfoil" },
   * where all rules will be iterated through
   */
  const filterIncludes = (k, v) => k.includes(v);
  const filterIs = (k, v) => k === v;

  let returnCache = Object.values(cache[set]);

  // This can definitely be improved
  rules.forEach((rule) => {
    returnCache = returnCache.filter((c) =>
      c && c[rule.k] && rule.t === "includes"
        ? filterIncludes(c[rule.k], rule.v)
        : filterIs(c[rule.k], rule.v));
  });

  return returnCache;
}

async function convertForCache(card) {
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
    frameEffects: card.frame_effects,
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
    price: (card.prices.usd ?? card.prices.usd_foil) ?? 0,
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
  getFullSet,
  getRandom,
  lucky,
  setFilter,
};
