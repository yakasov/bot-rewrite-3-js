"use strict";

const fs = require("fs");
const { Cards } = require("scryfall-api");
const https = require("https");
const { joinImages } = require("join-images");
const cache = require("../resources/mtg/mtgCache.json");
const searchCache = require("../resources/mtg/mtgSearchCache.json");
const { allSets } = require("../resources/mtg/mtgSets.js");

async function searchHelper(set, type) {
  /*
   * Run a full search.
   * If we already have the set AND type searched,
   * then we can use searchCache.
   * Otherwise, process data like normal
   */
  const searchTerm = `set:${set} type:${type}`;
  let result = [];

  if (!searchCache.searchTerms) {
    searchCache.searchTerms = [];
  }

  if (searchCache.searchTerms.includes(searchTerm) && false) {
    const potentialCards = cache[set];
    result = [];

    Object.values(potentialCards)
      .filter((c) => Object.keys(potentialCards)
        .includes(c.number))
      .forEach((c) => {
        if (c.type_line.toLowerCase()
          .includes(type)) {
          result.push(c);
        }
      });
  } else {
    result = await Cards.search(searchTerm)
      .all()
      .map((c) => convertForCache(c));

    /*
     * Cache all cards from the search under their set
     * Cache the numbers in searchCache (and then cache normally)
     * These can then be cross-referenced with cards in the cache
     */
    if (!searchCache[set]) {
      searchCache[set] = [];
    }
    console.log(result);
    result.forEach((c) => {
      searchCache[set].push(c.number);
      cache[set][c.number] = c;
    });

    searchCache.searchTerms.push(searchTerm);

    fs.writeFileSync("./resources/mtg/mtgCache.json", JSON.stringify(cache));
    fs.writeFileSync("./resources/mtg/mtgSearchCache.json", JSON.stringify(searchCache));
  }

  return result;
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
  boosterGetConnected(set) {},
  boosterGetHeadTurning(set) {},
  async boosterGetLand(set) {
    const cards = await searchHelper(set.code, "land");
    const card = getRandom(cards);

    if (lucky(15)) {
      card.foil = true;
    }
    
    return card;
  },
  boosterGetMythic(set) {},
  boosterGetRare(set) {},
  boosterGetWildCard(set) {},
};
