"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} = require("discord.js");

const defaultState = { cards: [], total: 0 };
const dealer = structuredClone(defaultState);
const player = structuredClone(defaultState);
let doubleDownAmount = 0;

function initialDraw() {
  dealer.cards.push(getRandomCard(), getRandomCard());
  player.cards.push(getRandomCard(), getRandomCard());
  dealer.total = totalCards(dealer.cards);
  player.total = totalCards(player.cards);
}

async function processTurn(interaction, bet, playerEnded = false) {
  if (playerEnded) {
    while (dealer.total < player.total) {
      dealer.cards.push(getRandomCard());
      dealer.total = totalCards(dealer.cards);
    }
  }

  const [result, text] = getText(interaction, bet, playerEnded);

  if (result !== "play") {
    return interaction.editReply({
      components: [],
      content: text,
    });
  }

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

  const row = new ActionRowBuilder()
    .addComponents(
      hitButton,
      doubleButton,
      holdButton
    );

  const response = await interaction.editReply({
    components: [row],
    content: text,
  });

  const collectorFilter = (i) => i.user.id === interaction.user.id;

  try {
    const confirmation = await response.awaitMessageComponent({
      filter: collectorFilter,
      time: 60_000,
    });

    if (confirmation.customId === "hit") {
      player.cards.push(getRandomCard());
      player.total = totalCards(player.cards);
      return processTurn(interaction, bet, false);
    } else if (confirmation.customId === "double") {
      player.cards.push(getRandomCard());
      player.total = totalCards(player.cards);
      doubleDownAmount = bet;
      return processTurn(interaction, bet, true);
    } else if (confirmation.customId === "hold") {
      return processTurn(interaction, bet, true);
    }
  } catch (e) {
    return interaction.editReply({
      components: [],
      content: "No activity for 60 seconds, ending the game.",
    });
  }

  // We shouldn't ever get here, but... just in case
  return null;
}

function getText(interaction, bet, playerEnded) {
  let extraText = "";
  let status = "play";

  if (player.total > 21 || (dealer.cards.length === 2 && dealer.total === 21)) {
    extraText = `You have gone bust, losing ${doubleDownAmount + bet} tokens!`;
    status = "loss";
    globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens -=
      doubleDownAmount + bet;
  }

  if (
    (dealer.total > 21 && player.total <= 21) ||
    (player.cards.length === 2 && player.total === 21)
  ) {
    extraText = `You have won, gaining ${doubleDownAmount + bet * 2} tokens!`;
    status = "win";
    globalThis.stats[interaction.guild.id][interaction.user.id].luckTokens +=
      doubleDownAmount + bet * 2;
  }

  if (player.total === dealer.total && playerEnded) {
    extraText = "You have broken even - your token amount is unaffected.";
    status = "draw";
  }

  return [
    status,
    `Dealer cards: ${
      status === "play" ? `${dealer.cards[0]}, ?` : dealer.cards.join(", ")
    }\nYour cards: ${player.cards.join(", ")}\n
Current bet: ${bet} tokens\n\n
${extraText}`,
  ];
}

function getRandomCard() {
  const cards = ["A", "2", "3", "4", "5", "6", "7", "8", "9", "J", "Q", "K"];
  return cards[Math.floor(Math.random() * cards.length)];
}

function totalCards(cards) {
  let cardSums = [0, 0];
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
  cardSums = cardSums.filter((s) => s < 22);
  return Math.max(...cardSums);
}

module.exports = {
  data: new SlashCommandBuilder()
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
    return processTurn(interaction, bet);
  },
};
