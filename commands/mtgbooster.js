"use strict";

const {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  SlashCommandBuilder,
} = require("discord.js");
const fs = require("fs");
const {
  getFullSet,
  getRandom,
  setFilter,
} = require("../util/mtgBoosterHelper.js");
const {
  boosterGetConnected,
  boosterGetFoil,
  boosterGetHeadTurning,
  boosterGetLand,
  boosterGetRareOrMythic,
  boosterGetWildCard,
} = require("../util/mtgBoosterGenerator.js");
const { allSets } = require("../resources/mtg/mtgSets.js");
const cache = require("../resources/mtg/mtgCache.json");

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
const interactions = {};

async function generateBoosterPack(interaction, chosenSet = null) {
  const { id } = interaction.user;
  const setToUse =
    allSets.find((s) => s.code === chosenSet) ||
    allSets[Math.floor(Math.random() * allSets.length)];

  if (!cache[setToUse.code]) {
    interaction.editReply(
      `Fetching ${setToUse.count} cards for set ${setToUse.name} (${setToUse.code})...`
    );
    await getFullSet(setToUse.code);
    interaction.editReply(`Created cache for ${setToUse.name}.`);
  }

  interactions[id].cards = [
    boosterGetLand(setToUse),
    ...boosterGetConnected(setToUse),
    boosterGetHeadTurning(setToUse),
    ...boosterGetWildCard(setToUse),
    boosterGetRareOrMythic(setToUse),
    boosterGetFoil(setToUse),
  ].filter((c) => c !== undefined);

  // If we couldn't filter the cards properly, fill with random cards
  for (let _ = interactions[id].cards.length; _ < 12; _++) {
    interactions[id].cards.push(getRandom(setFilter(setToUse.code, [])));

    if (!interactions[id].cardFill) {
      interactions[id].cardFill = _;
    }
  }
}

function getButtons(id) {
  const buttons = [
    new ButtonBuilder()
      .setCustomId("previousPage")
      .setLabel(interactions[id].page === 2 ? "Summary" : "Previous card")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(interactions[id].page === 1),
    new ButtonBuilder()
      .setCustomId("nextPage")
      .setLabel(
        interactions[id].page === 13 ? "Return to Summary" : "Next card"
      )
      .setStyle(ButtonStyle.Secondary),
  ];

  return new ActionRowBuilder()
    .addComponents(...buttons);
}

function getContent(id) {
  const capitaliseFirst = (s) =>
    String(s[0])
      .toUpperCase() + String(s)
      .slice(1);
  const c = interactions[id].cards[interactions[id].page - 2];
  interactions[id].overallPrice = Math.round(
    (interactions[id].cards.reduce(
      (partial, ca) =>
        partial + parseFloat((ca.foil ? ca.price_foil : ca.price) ?? 0),
      0
    ) *
      100) /
      100
  );

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
            value: `$${interactions[id].overallPrice}`,
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
          c.local ? `attachment://${c.image.split("/")
            .pop()}.jpg` : c.image
        ),
      file,
    ];
  } catch (e) {
    console.error(e);
    console.warn(c);
  }

  return null;
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

  Object.entries(replacements)
    .forEach(([k, v]) => {
      returnText = returnText.replaceAll(k, v);
    });

  // This is required (but shouldn't be with the text ?? above)
  return returnText || "-";
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mtgbooster")
    .setDescription("Random card")
    .addStringOption((opt) =>
      opt
        .setName("set")
        .setDescription("Which set to pull cards from (leave blank for random)")),
  async execute(interaction) {
    interactions[interaction.user.id] = {
      cards: [],
      page: 1,
    };
    const chosenSet = interaction.options.getString("set") ?? null;

    await interaction.deferReply();
    await generateBoosterPack(interaction, chosenSet);

    let [embed, file] = getContent(interaction.user.id);
    const response = await interaction.editReply({
      components: [getButtons(interaction.user.id)],
      embeds: [embed],
      files: file ? [file] : [],
    });

    const collectorFilter = (i) => i.user.id === interaction.user.id;
    const collector = response.createMessageComponentCollector({
      filter: collectorFilter,
      idle: 300_000,
    });

    collector.on("collect", async (i) => {
      if (i.customId === "nextPage") {
        if (interactions[i.user.id].page === 13) {
          interactions[i.user.id].page = 1;
        } else {
          interactions[i.user.id].page++;
        }
      } else {
        interactions[i.user.id].page--;
      }

      [embed, file] = getContent(interaction.user.id);
      await i.update({
        components: [getButtons(interaction.user.id)],
        embeds: [embed],
        files: file ? [file] : [],
      });
    });
  },
};
