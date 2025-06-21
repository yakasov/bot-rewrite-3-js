"use strict";

const { Sets } = require("scryfall-api");
const { SlashCommandBuilder } = require("discord.js");
const { getFullSet } = require("../util/mtg/boosterHelper.js");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mtgfillcache")
    .setDescription("Fill MTG cache"),
  async execute() {
    const rawSets = Sets.all()
      .then((response) => response);
    const allSets = [];

    (await rawSets).forEach((s) => allSets.push(s.code));
    for (const set of allSets) {
      console.log(`Processing set ${set}...`);
      try {
        await getFullSet(set);
      } catch (err) {
        console.log(err);
      }
    }
    console.log("Finished processing all sets!");
  }
};
