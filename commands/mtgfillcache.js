"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { allSets } = require("../resources/mtg/mtgSets.js");
const cache = require("../resources/mtg/mtgCache.json");
const { getFullSet } = require("../util/mtgBoosterHelper.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mtgfillcache")
    .setDescription("Fill MTG cache"),
  execute(interaction) {
    const cachedSets = Object.keys(cache);
    allSets.forEach(async (s) => {
      if (!cachedSets.includes(s.code)) {
        console.log(`Processing set ${s.code}...`);
        await getFullSet(s.code);
      }
    });
    console.log("Finished processing all sets!");
  },
};
