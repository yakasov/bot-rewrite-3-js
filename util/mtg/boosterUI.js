"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  AttachmentBuilder,
} = require("discord.js");
const { MTG_PACK_SIZE } = require("../consts.js");
const { allSets } = require("../../resources/mtg/mtgSets.js");

const replacements = {
  "{1}": " :one: ",
  "{2}": " :two: ",
  "{3}": " :three: ",
  "{4}": " :four: ",
  "{5}": " :five: ",
  "{6}": " :six: ",
  "{7}": " :seven: ",
  "{8}": " :eight: ",
  "{9}": " :nine: ",
  "{B}": " :cold_face: ",
  "{C}": " :nerd: ",
  "{G}": " :nauseated_face: ",
  "{R}": " :rage: ",
  "{T}": " :arrow_right_hook: ",
  "{U}": " :new_moon_with_face: ",
  "{W}": " :alien: ",
  "{X}": " :regional_indicator_x: ",
};

function getButtons(interactions, id) {
  const buttons = [
    new ButtonBuilder()
      .setCustomId("previousPage")
      .setLabel(interactions[id].page === 2 ? "Summary" : "Previous card")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(interactions[id].page === 1),
    new ButtonBuilder()
      .setCustomId("nextPage")
      .setLabel(
        interactions[id].page === MTG_PACK_SIZE + 1
          ? "Return to Summary"
          : "Next card"
      )
      .setStyle(ButtonStyle.Secondary),
  ];
  return new ActionRowBuilder()
    .addComponents(...buttons);
}

function getRarityString(cards) {
  const rarities = {
    common: 0,
    uncommon: 0,
    rare: 0,
    mythic: 0,
  };

  for (const card of cards) {
    if (Object.hasOwn(rarities, card.rarity)) {
      rarities[card.rarity]++;
    }
  }

  return [
    `${rarities.common} C`,
    `${rarities.uncommon} U`,
    `${rarities.rare} R`,
    `${rarities.mythic} RM`,
  ].join(" // ");
}

function getAllCardsString(cards) {
  return cards.map((card, i) => `${i + 1}. ${card.name}`)
    .join("\n");
}

function replaceIcons(text) {
  return (
    Object.entries(replacements)
      .reduce(
        (currentText, [pattern, emoji]) => currentText.replaceAll(pattern, emoji),
        text ?? "-"
      ) || "-"
  );
}

function getContent(interactions, id) {
  const capitaliseFirst = (string) =>
    String(string[0])
      .toUpperCase() + String(string)
      .slice(1);
  const card = interactions[id].cards[interactions[id].page - 2];

  const setPrice = allSets.find(
    (set) => set.code === interactions[id].cards[1].set
  ).price;
  const cardValue = interactions[id].overallPrice;

  if (interactions[id].page === 1) {
    return [
      new EmbedBuilder()
        .setTitle("Booster Pack Summary")
        .addFields(
          {
            name: "Set",
            value: `${interactions[id].cards[1].set_name} (${interactions[id].cards[1].set})`,
          },
          {
            name: "Rarities",
            value: getRarityString(interactions[id].cards),
          },
          {
            name: "Overall Price",
            value: `Set: $${setPrice} // Cards: $${cardValue} // Profit: $${cardValue - setPrice}`,
          },
          { name: "\u200B", value: "\u200B" },
          {
            name: "Cards",
            value: getAllCardsString(interactions[id].cards),
          },
          { name: "\u200B", value: "\u200B" },
          {
            name: "Extra cards added?",
            value: interactions[id].cardFill
              ? `Yes, added ${interactions[id].cardFill} card(s)`
              : "No",
          }
        ),
      null,
    ];
  }

  try {
    const file = card.local ? new AttachmentBuilder(`${card.image}.jpg`) : null;
    return [
      new EmbedBuilder()
        .setTitle(`${interactions[id].page - 1} - ${card.name}`)
        .setURL(card.url)
        .setDescription(card.type_line)
        .addFields(
          {
            name: "Set",
            value: `${card.set_name} (${card.set})`,
          },
          {
            name: "Oracle text",
            value: replaceIcons(card.oracle_text),
          },
          {
            name: "Flavour text",
            value: replaceIcons(card.flavour_text),
          },
          { name: "\u200B", value: "\u200B" },
          {
            inline: true,
            name: "Rarity",
            value: capitaliseFirst(card.rarity),
          },
          {
            inline: true,
            name: "Foil",
            value: card.foil ? "Yes" : "No",
          },
          {
            inline: true,
            name: "Price",
            value: `$${(card.foil ? card.price_foil : card.price) || "???"}`,
          }
        )
        .setImage(
          card.local
            ? `attachment://${card.image.split("/")
              .pop()}.jpg`
            : card.image
        ),
      file,
    ];
  } catch (err) {
    console.error(err);
    console.warn(card);
  }

  return null;
}

module.exports = {
  getButtons,
  getContent,
};
