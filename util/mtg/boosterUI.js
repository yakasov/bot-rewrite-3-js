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
  return new ActionRowBuilder().addComponents(...buttons);
}

function getRarityString(cards) {
  const commons = cards.filter((c) => c.rarity === "common").length;
  const uncommons = cards.filter((c) => c.rarity === "uncommon").length;
  const rares = cards.filter((c) => c.rarity === "rare").length;
  const mythics = cards.filter((c) => c.rarity === "mythic").length;
  return `${commons} C // ${uncommons} U // ${rares} R // ${mythics} RM`;
}

function getAllCardsString(cards) {
  let returnString = "";
  cards.forEach((c, i) => {
    returnString += `${i + 1}. ${c.name}\n`;
  });
  return returnString;
}

function replaceIcons(text) {
  let returnText = text ?? "-";
  Object.entries(replacements).forEach(([k, v]) => {
    returnText = returnText.replaceAll(k, v);
  });
  return returnText || "-";
}

function getContent(interactions, id) {
  const capitaliseFirst = (s) =>
    String(s[0]).toUpperCase() + String(s).slice(1);
  const c = interactions[id].cards[interactions[id].page - 2];

  const setPrice = allSets.find(
    (s) => s.code === interactions[id].cards[1].set
  ).price;
  const cardValue = interactions[id].overallPrice;

  if (interactions[id].page === 1) {
    return [
      new EmbedBuilder().setTitle("Booster Pack Summary").addFields(
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
    const file = c.local ? new AttachmentBuilder(`${c.image}.jpg`) : null;
    return [
      new EmbedBuilder()
        .setTitle(`${interactions[id].page - 1} - ${c.name}`)
        .setURL(c.url)
        .setDescription(c.type_line)
        .addFields(
          {
            name: "Set",
            value: `${c.set_name} (${c.set})`,
          },
          {
            name: "Oracle text",
            value: replaceIcons(c.oracle_text),
          },
          {
            name: "Flavour text",
            value: replaceIcons(c.flavour_text),
          },
          { name: "\u200B", value: "\u200B" },
          {
            inline: true,
            name: "Rarity",
            value: capitaliseFirst(c.rarity),
          },
          {
            inline: true,
            name: "Foil",
            value: c.foil ? "Yes" : "No",
          },
          {
            inline: true,
            name: "Price",
            value: `$${(c.foil ? c.price_foil : c.price) || "???"}`,
          }
        )
        .setImage(
          c.local ? `attachment://${c.image.split("/").pop()}.jpg` : c.image
        ),
      file,
    ];
  } catch (e) {
    console.error(e);
    console.warn(c);
  }

  return null;
}

module.exports = {
  getButtons,
  getContent,
};
