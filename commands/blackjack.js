"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} = require("discord.js");
const { getNicknameInteraction } = require("../util/common.js");

const defaultState = { 
  "cards": [],
  "total": 0 
};
const dealer = structuredClone(defaultState);
const player = structuredClone(defaultState);

function initialDraw() {
  dealer.cards = [];
  player.cards = [];
  dealer.total = 0;
  player.total = 0;

  dealer.cards.push(getRandomCard(), getRandomCard());
  player.cards.push(getRandomCard(), getRandomCard());
  dealer.total = totalCards(dealer.cards);
  player.total = totalCards(player.cards);
}

async function playGame(interaction, bet) {
  let text = getText(interaction, bet);

  const hitButton = new ButtonBuilder()
    .setCustomId("hit")
    .setLabel("Hit")
    .setStyle(ButtonStyle.Secondary);

  const doubleButton = new ButtonBuilder()
    .setCustomId("double")
    .setLabel("Double down")
    .setStyle(ButtonStyle.Secondary);

  const holdButton = new ButtonBuilder()
    .setCustomId("hold")
    .setLabel("Hold")
    .setStyle(ButtonStyle.Danger);

  const firstTurnRow = new ActionRowBuilder()
    .addComponents(
      hitButton,
      doubleButton,
      holdButton
    );

  const row = new ActionRowBuilder()
    .addComponents(hitButton, holdButton);

  const response = await interaction.editReply({
    "components": [firstTurnRow],
    "content": text
  });

  const collectorFilter = (i) => i.user.id === interaction.user.id;
  const collector = response.createMessageComponentCollector({
    "filter": collectorFilter,
    "time": 60_000
  });

  collector.on("collect", async (i) => {
    if (i.customId === "hit") {
      player.cards.push(getRandomCard());
      player.total = totalCards(player.cards);
      text = getText(interaction, bet);

      await i.update({
        "components": [row],
        "content": text
      });
    } else if (i.customId === "double") {
      player.cards.push(getRandomCard());
      player.total = totalCards(player.cards);

      while (dealer.total <= player.total) {
        dealer.cards.push(getRandomCard());
        dealer.total = totalCards(dealer.cards);
      }

      text = getText(interaction, bet * 2, true);

      await i.update({
        "components": [],
        "content": text
      });
      collector.stop();
    } else if (i.customId === "hold") {
      while (dealer.total <= player.total) {
        dealer.cards.push(getRandomCard());
        dealer.total = totalCards(dealer.cards);
      }

      text = getText(interaction, bet, true);

      await i.update({
        "components": [],
        "content": text
      });
      collector.stop();
    }

    return null;
  });

  return null;
}

function getText(interaction, bet, playerEnded = false) {
  let extraText = "";
  let status = "play";

  if (
    player.total > 21 ||
    (dealer.cards.length === 2 && dealer.total === 21) ||
    (playerEnded && dealer.total > player.total)
  ) {
    extraText = `You have ${
      player.total > 21 ? "gone bust" : "lost"
    }, losing ${bet} tokens!`;
    status = "loss";
    globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens -=
      bet;
  }

  if (
    (dealer.total > 21 && player.total <= 21) ||
    (player.cards.length === 2 && player.total === 21) ||
    (playerEnded && dealer.total < player.total)
  ) {
    extraText = `You have won, gaining ${bet * 2} tokens!`;
    status = "win";
    globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens +=
      bet * 2;
  }

  if (player.total === dealer.total && playerEnded) {
    extraText = "You have broken even - your token amount is unaffected.";
    status = "draw";
  }

  return `PLAYER: ${getNicknameInteraction(interaction)}\n\nDealer cards: ${
    status === "play"
      ? `${dealer.cards[0]}, ?`
      : dealer.cards.join(", ")
  } (${
    status === "play"
      ? "?"
      : dealer.total
  })\nYour cards: ${player.cards.join(", ")} (${player.total})\n
Current bet: ${bet} tokens\n\n=====================\n
${extraText}`;
}

function getRandomCard() {
  /* eslint-disable-next-line array-element-newline */
  const cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "J", "Q", "K"];
  return cards[Math.floor(Math.random() * cards.length)];
}

function totalCards(cards) {
  let cardSums = [
    0,
    0
  ];
  cards.forEach((card) => {
    switch (card) {
    case "A":
      cardSums[0]++;
      cardSums[1] += 11;
      break;
    case "J":
    case "Q":
    case "K":
      cardSums = cardSums.map((s) => s + 10);
      break;
    default:
      cardSums = cardSums.map((s) => s + parseInt(card, 10));
    }
  });
  const filteredCardSums = cardSums.filter((s) => s < 22);
  return filteredCardSums.length
    ? Math.max(...filteredCardSums)
    : Math.max(...cardSums);
}

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("blackjack")
    .setDescription("Play blackjack for tokens!")
    .addIntegerOption((opt) =>
      opt
        .setName("bet")
        .setDescription("The amount of tokens to bet")
        .setMinValue(1)
        .setMaxValue(10)
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply();
    const bet = interaction.options.getInteger("bet");
    const tokens =
      globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens;

    if (!tokens) {
      return interaction.editReply("You don't have any tokens!");
    }

    if (tokens < bet) {
      return interaction.editReply(
        "You don't have enough tokens for that bet!"
      );
    }

    initialDraw();
    return playGame(interaction, bet);
  }
};
