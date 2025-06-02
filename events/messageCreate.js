"use strict";

const { Cards } = require("scryfall-api");
const { EmbedBuilder } = require("discord.js");

const checkAchievements = require("../util/achievements.js");
const {
  checkMessageResponse,
  checkMessageReactions,
} = require("../util/messageHandlers.js");
const { addToStats } = require("../util/stats");

module.exports = async function handleMessageCreate(message) {
  // Check if Scryfall has given a stupid response
  if (
    message.author.id === "268547439714238465" &&
    message?.embeds[0]?.data?.description?.includes("Multiple cards match")
  ) {
    const cardName = message.embeds[0].data.description.match(
      /(?<=Multiple cards match “)(?:.*)(?=”, can you be more specific?)/gu
    )[0];

    if (cardName.length > 1) {
      const results = await Cards.autoCompleteName(cardName);

      /*
       * Sometimes this happens with names like 'miku'
       * I think the Scryfall bot works for all languages
       * whereas AutoCompleteName only works for one at a time
       */
      if (!results.length) {
        return;
      }

      let embedString = "";
      results.forEach((c, i) => {
        embedString += `${i + 1}. ${c}\n`;
      });

      const embed = new EmbedBuilder().setTitle("Scryfall Cards").addFields({
        name: `Returned ${results.length} cards:`,
        value: embedString,
      });

      message.channel.send({ embeds: [embed] });
      return;
    }
  }

  if (message.author.bot || !message.guild) {
    return;
  }

  await checkMessageResponse(message);
  if (
    globalThis.stats[message.guild.id] &&
    (globalThis.stats[message.guild.id].allowResponses ?? true)
  ) {
    await checkMessageReactions(message);
  }

  addToStats({
    guildId: message.guild.id,
    type: "message",
    userId: message.author.id,
  });

  checkAchievements.run(message);
};
