"use strict";

const { getRandom, lucky, setFilter } = require("./boosterHelper");

function boosterGetConnected(set) {
  const chances = [
    { chance: 35, common: 5, uncommon: 1 },
    { chance: 75, common: 4, uncommon: 2 },
    { chance: 87.5, common: 3, uncommon: 3 },
    { chance: 94.5, common: 2, uncommon: 4 },
    { chance: 98, common: 1, uncommon: 5 },
    { chance: 100, common: 0, uncommon: 6 },
  ];
  const roll = Math.random() * 100;
  let cardsToPull = chances.find(({ chance }) => roll < chance);

  // SLD has 1 common outside of lands
  if (set.code === "sld") {
    cardsToPull = { common: 1, uncommon: 5 };
  }

  const commonCards = setFilter(set.code, [
    { k: "rarity", t: "is", v: "common" },
  ]);
  const uncommonCards = setFilter(set.code, [
    { k: "rarity", t: "is", v: "uncommon" },
  ]);
  const cards = [];

  for (let c = 0; c < cardsToPull.common; c++) {
    cards.push(getRandom(commonCards));
  }
  for (let u = 0; u < cardsToPull.uncommon; u++) {
    cards.push(getRandom(uncommonCards));
  }

  return cards;
}

function boosterGetFoil(set) {
  const cards = setFilter(set.code, [{ k: "canBeFoil", t: "is", v: true }]);
  const card = getRandom(cards.length === 0 ? setFilter(set.code, []) : cards);
  card.foil = true;

  return card;
}

function boosterGetHeadTurning(set) {
  const cards = setFilter(set.code, [
    { k: "frameEffects", t: "includes", v: "showcase" },
  ]);
  const card = getRandom(cards.length === 0 ? setFilter(set.code, []) : cards);

  return card;
}

function boosterGetLand(set) {
  const isFoil = lucky(15);
  const cards = setFilter(set.code, [
    { k: "type_line", t: "includes", v: "Land" },
  ]);
  const card = getRandom(cards);
  card.foil = isFoil;

  return card;
}

function boosterGetRareOrMythic(set) {
  const isMythic = lucky(13.5);
  const cards = setFilter(set.code, [
    { k: "rarity", t: "is", v: isMythic ? "mythic" : "rare" },
  ]);
  const card = getRandom(cards);

  return card;
}

function boosterGetWildCard(set) {
  const chances = [
    { chance: 49, common: 2, rare: 0, uncommon: 0 },
    { chance: 73.5, common: 1, rare: 0, uncommon: 1 },
    { chance: 91, common: 1, rare: 1, uncommon: 0 },
    { chance: 94.1, common: 0, rare: 0, uncommon: 2 },
    { chance: 98.4, common: 0, rare: 1, uncommon: 1 },
    { chance: 100, common: 0, rare: 2, uncommon: 0 },
  ];

  // SLD has 1 common outside of lands
  let roll = Math.random() * 100;
  if (set.code === "sld") {
    roll = 90 + roll / 10;
  }

  const cardsToPull = chances.find(({ chance }) => roll < chance);
  const cards = [];

  const commonCards = setFilter(set.code, [
    { k: "rarity", t: "is", v: "common" },
  ]);
  const uncommonCards = setFilter(set.code, [
    { k: "rarity", t: "is", v: "uncommon" },
  ]);

  for (let c = 0; c < cardsToPull.common; c++) {
    cards.push(getRandom(commonCards));
  }
  for (let u = 0; u < cardsToPull.uncommon; u++) {
    cards.push(getRandom(uncommonCards));
  }
  for (let r = 0; r < cardsToPull.rare; r++) {
    cards.push(boosterGetRareOrMythic(set));
  }

  return cards;
}

module.exports = {
  boosterGetConnected,
  boosterGetFoil,
  boosterGetHeadTurning,
  boosterGetLand,
  boosterGetRareOrMythic,
  boosterGetWildCard,
};
