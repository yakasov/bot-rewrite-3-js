"use strict";

const { Cards } = require("scryfall-api");
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { combineImages } = require("./boosterHelper.js");

const scryfallPattern = /\[\[(?<card>[^|\]]+?)(?:\|{1,2}(?<set>[^\]]+))?\]\]/gu;

async function checkScryfallMessage(message) {
  let match = null;
  while ((match = scryfallPattern.exec(message.content)) !== null) {
    const isImage = match.groups.card[0] === "!";
    const cardName = match.groups.card.substring(Number(isImage));
    const isSpecificSet = match.groups.set;

    const results = await Cards.autoCompleteName(cardName);

    if (!results.length) {
      scryfallNoCardFound(message, cardName);
    } else if (results.length === 1) {
      await scryfallCardFound(message, results[0], isSpecificSet);
    } else {
      scryfallShowCardList(message, results);
    }
  }
}

function scryfallNoCardFound(message, cardName) {
  const embed = new EmbedBuilder()
    .setDescription(
      `No card found for "${cardName}"`
    );

  message.channel.send({ embeds: [embed] });
}

async function scryfallCardFound(message, cardName, set) {
  const cardDetails = await Cards.byName(cardName, set);
  const lowestHighestData = await getLowestHighestData(cardDetails.oracle_id);

  const [isImageLocal, imageUrl] = await getImageUrl(cardDetails);
  const attachment = isImageLocal
    ? new AttachmentBuilder(`${imageUrl}.jpg`)
    : null;
  const footer = `${
    cardDetails.legalities.commander === "legal" ? "Legal" : "Non-legal"
  } // $${cardDetails.prices.usd} // ${
    cardDetails.rarity.charAt(0)
      .toUpperCase() + cardDetails.rarity.slice(1)
  }`;

  const embed = new EmbedBuilder()
    .setTitle(cardDetails.name)
    .setURL(cardDetails.scryfall_uri)
    .setFooter({ text: footer })
    .setImage(
      isImageLocal
        ? `attachment://${imageUrl.split("/")
          .pop()}.jpg`
        : imageUrl
    )
    .addFields({
      name: "Prices",
      value: `Lowest: ${lowestHighestData.lowestSet} @ $${lowestHighestData.lowestPrice}\nHighest: ${lowestHighestData.highestSet} @ $${lowestHighestData.highestPrice}`,
    });

  message.channel.send({
    content: cardDetails.scryfall_uri.replace("?utm_source=api", ""),
    embeds: [embed],
    files: attachment ? [attachment] : [],
  });
}

async function getLowestHighestData(oracleId) {
  const oracleData = await fetch(
    `https://api.scryfall.com/cards/search?order=released&q=oracleid%3A${oracleId}&unique=prints`
  )
    .then((r) => r.json());
  const lowestHighestData = {
    highestPrice: 0,
    highestSet: "",
    lowestPrice: 10000,
    lowestSet: "",
  };
  Object.values(oracleData.data)
    .forEach((cardData) => {
      const lowestPrice = Math.min(
        parseFloat(cardData.prices.usd ?? 10000),
        parseFloat(cardData.prices.usd_foil ?? 10000)
      );
      const highestPrice = Math.max(
        parseFloat(cardData.prices.usd ?? 0),
        parseFloat(cardData.prices.usd_foil ?? 0)
      );
      if (lowestPrice < lowestHighestData.lowestPrice) {
        lowestHighestData.lowestPrice = lowestPrice;
        lowestHighestData.lowestSet = cardData.set;
      }

      if (highestPrice > lowestHighestData.highestPrice) {
        lowestHighestData.highestPrice = highestPrice;
        lowestHighestData.highestSet = cardData.set;
      }
    });

  return lowestHighestData;
}

async function getImageUrl(cardDetails) {
  if (
    cardDetails.card_faces?.length === 2 &&
    cardDetails.card_faces[0].image_uris
  ) {
    return [true, await combineImages(cardDetails)];
  }

  return [false, cardDetails.image_uris.large];
}

function scryfallShowCardList(message, results) {
  let embedString = "";
  results.forEach((c, i) => {
    embedString += `${i + 1}. ${c}\n`;
  });

  const embed = new EmbedBuilder()
    .setTitle("Scryfall Cards")
    .addFields({
      name: `Returned ${results.length} cards:`,
      value: embedString,
    });

  message.channel.send({ embeds: [embed] });
}

module.exports = {
  checkScryfallMessage,
};
