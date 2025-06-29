"use strict";

const { Cards } = require("scryfall-api");
const {
  ActionRowBuilder,
  AttachmentBuilder,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
} = require("discord.js");
const { combineImages } = require("./boosterHelper.js");
const { REGEX_SCRYFALL_PATTERN } = require("../consts.js");

async function checkScryfallMessage(message) {
  const promises = [];
  let match = null;

  while ((match = REGEX_SCRYFALL_PATTERN.exec(message.content)) !== null) {
    const isImage = match.groups.card[0] === "!";
    const cardName = match.groups.card.substring(Number(isImage))
      .trim();
    const isSpecificSet = match.groups.set?.trim();

    promises.push(scryfallGetCard(message, cardName, isSpecificSet));
  }

  await Promise.all(promises);
}

async function scryfallGetCard(
  message,
  cardName,
  isSpecificSet = false,
  fromSelectMenu = false
) {
  const results = await Cards.autoCompleteName(cardName);

  /*
   * An explanation for 'fromSelectMenu':
   * basically, if we get multiple cards from Scryfall (eg when searching 'pan')
   * then the user is given a choice of the 20 best matching cards (Scryfall limit).
   *
   * When the user picks a choice that is _also_ ambiguous (eg 'pandemonium'),
   * we don't want to show them another SelectMenu - otherwise they'll
   * forever loop trying to select the ambiguous card.
   *
   * If we call this function from scryfallShowCardList,
   * _always_ go straight to scryfallCardFound, using the first result if multiple.
   */

  if (!results.length) {
    scryfallNoCardFound(message, cardName);
  } else if (results.length === 1 || fromSelectMenu) {
    await scryfallCardFound(message, results[0], isSpecificSet);
  } else {
    await scryfallShowCardList(message, cardName, results);
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
  const cardDetails = await Cards.byName(cardName, set, false);

  if (!cardDetails) {
    return message.channel.send(
      `Ran into an error fetching ${cardName} for set ${set}!`
    );
  }

  const [isImageLocal, imageUrl] = await getImageUrl(cardDetails);
  const attachment = isImageLocal
    ? new AttachmentBuilder(`${imageUrl}.jpg`)
    : null;
  const foilOnly =
    cardDetails.prices.usd === null && cardDetails.prices.usd_foil !== null;
  const footer = `${
    cardDetails.legalities.commander === "legal" ? "Legal" : "Non-legal"
  } // $${cardDetails.prices.usd ?? cardDetails.prices.usd_foil ?? "???"}${foilOnly ? " (F)" : ""} // ${
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

  const oracleId = cardDetails.oracle_id ?? cardDetails.card_faces[0].oracle_id;
  if (oracleId) {
    const lowestHighestData = await getLowestHighestData(oracleId);
    embed.addFields({
      name: "Prices",
      value: `
Lowest: [${lowestHighestData.lowestSet} @\
$${lowestHighestData.lowestPrice}](${lowestHighestData.lowestUrl})
Highest: [${lowestHighestData.highestSet} @\
$${lowestHighestData.highestPrice}](${lowestHighestData.highestUrl})
`,
    });
  } else {
    console.error(
      `Couldn't find an Oracle ID for card named ${cardDetails.name}, ID ${cardDetails.id}!`
    );
  }

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
    highestUrl: "",
    lowestPrice: 10000,
    lowestSet: "",
    lowestUrl: "",
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
        lowestHighestData.lowestUrl = cardData.scryfall_uri?.replace(
          "?utm_source=api",
          ""
        );
      }

      if (highestPrice > lowestHighestData.highestPrice) {
        lowestHighestData.highestPrice = highestPrice;
        lowestHighestData.highestSet = cardData.set;
        lowestHighestData.highestUrl = cardData.scryfall_uri?.replace(
          "?utm_source=api",
          ""
        );
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

async function scryfallShowCardList(message, cardName, results) {
  const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("scryfall_list_select")
    .setPlaceholder("Choose a card")
    .addOptions(
      results.map((card, i) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${i + 1}. ${card}`)
          .setValue(card))
    );

  const row = new ActionRowBuilder()
    .addComponents(selectMenu);

  const multipleCardsMessage = await message.channel.send({
    components: [row],
    content: `Multiple cards found for "${cardName}"!`,
  });

  const filter = (interaction) =>
    interaction.isStringSelectMenu() &&
    interaction.user.id === message.author.id;

  try {
    const collected = await multipleCardsMessage.awaitMessageComponent({
      filter,
      time: 30_000,
    });

    const [selectedValue] = collected.values;
    await collected.update({
      components: [],
      content: `Fetching ${selectedValue}...`,
    });

    await scryfallGetCard(message, selectedValue, false, true);
    await multipleCardsMessage.delete()
      .catch((err) => console.error(err));
  } catch (err) {
    console.error(err);
    await multipleCardsMessage.edit({
      components: [],
      content: "No selection made in time.",
    });
  }
}

module.exports = {
  checkScryfallMessage,
};
