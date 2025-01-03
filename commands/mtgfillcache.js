"use strict";

const { Sets } = require("scryfall-api");
const { SlashCommandBuilder } = require("discord.js");
const cache = require("../resources/mtg/mtgCache.json");
const { getFullSet } = require("../util/mtgBoosterHelper.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mtgfillcache")
    .setDescription("Fill MTG cache"),
  async execute(interaction) {
    // Const cachedSets = Object.keys(cache);
    const rawSets = Sets.all()
      .then((r) => r);
    const allSets = [];

    (await rawSets).forEach((s) => allSets.push(s.code));
    for (const s of allSets) {
      console.log(`Processing set ${s}...`);
      try {
        await getFullSet(s);
      } catch (e) {
        console.log(e);
      }
    }
    console.log("Finished processing all sets!");
  },
};
