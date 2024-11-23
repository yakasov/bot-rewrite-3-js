"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { allSets } = require("../resources/mtg/mtgSets.js");
const cache = require("../resources/mtg/mtgCache.json");
const { getFullSet } = require("../util/mtgBoosterHelper.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mtgfillcache")
    .setDescription("Fill MTG cache"),
  async execute(interaction) {
    const cachedSets = Object.keys(cache);
    for (const s of allSets) {
      if (!cachedSets.includes(s.code)) {
        console.log(`Processing set ${s.code}...`);
        await getFullSet(s.code);
      }
    }
    console.log("Finished processing all sets!");
  },
};
