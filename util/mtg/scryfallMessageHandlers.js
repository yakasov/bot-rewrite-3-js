"use strict";

const { Cards } = require("scryfall-api");
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { combineImages } = require("./boosterHelper.js");

const scryfallPattern = /\[\[(?:[^\]]+)\]\]/gu;

async function checkScryfallMessage(message) {
  const matches = message.content.match(scryfallPattern);

  if (matches) {
    for (const match of matches) {
      const isImage = match.includes("[[!");
      const cardName = match
        .substring(0, match.length - 2)
        .substring(2 + isImage);

      const results = await Cards.autoCompleteName(cardName);

      if (!results.length) {
        scryfallNoCardFound(message, cardName);
      } else if (results.length === 1) {
        await scryfallCardFound(message, results[0]);
      } else {
        scryfallShowCardList(message, results);
      }
    }
  }
}

function scryfallNoCardFound(message, cardName) {
  const embed = new EmbedBuilder()
    .setDescription(`No card found for "${cardName}"`);

  message.channel.send({ embeds: [embed] });
}

async function scryfallCardFound(message, cardName) {
  const cardDetails = await Cards.byName(cardName);

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
    );

  message.channel.send({
    content: cardDetails.scryfall_uri.replace("?utm_source=api", ""),
    embeds: [embed],
    files: attachment ? [attachment] : [],
  });
}

async function getImageUrl(cardDetails) {
  if (cardDetails.card_faces?.length === 2 && cardDetails.card_faces[0].image_uris) {
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
