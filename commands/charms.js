"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} = require("discord.js");
const { statsConfig } = require("../resources/config.json");


function getButtons(charms, canBuy = true) {
  const buttons = [];

  for (const [
    i,
    charm
  ] of charms.entries()) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`charm${i}`)
        .setLabel(`Remove ${charm} charm`)
        .setStyle(ButtonStyle.Danger)
    );
  }

  if (buttons.length < 3) {
    buttons.push(
      new ButtonBuilder()
        .setCustomId(`charm${buttons.length + 1}`)
        .setLabel(`Fill charm slot ${buttons.length + 1}`)
        .setStyle(ButtonStyle.Secondary)
        .setDisabled(!canBuy)
    );
  }

  return new ActionRowBuilder()
    .addComponents(...buttons);
}

function generateCharm() {
  const charms = [
    "rep_bonus",
    "rep_mult",
    "xp_mult",
    "token_bonus",
    "msg_bonus",
    "msg_mult",
    "voice_bonus",
    "voice_mult"
  ];
  const roll = Math.floor(Math.random() * charms.length);
  const [rarity, colour, name] = getRarity();

  return { colour, effect: charms[roll], name, rarity };
}

function getRarity() {
  const rarityRoll = Math.random();
  // RarityBonus starts at highest possible
  let rarityBonus = 80; 
  let colour = 31;
  const name = "Legendary";

  if (rarityRoll < 0.33) {
    rarityBonus = 0;
    colour = 37;
  } else if (rarityRoll < 0.63) {
    rarityBonus = 20;
    colour = 32;
  } else if (rarityRoll < 0.79) {
    rarityBonus = 40;
    colour = 34;
  } else if (rarityRoll < 0.93) {
    rarityBonus = 60;
    colour = 35;
  }

  return [Math.ceil(Math.random() * 20) + rarityBonus, colour, name];
}

function getCharmName(effect) {
  switch (effect) {
  case "rep_bonus":
    return "Bonus Reputation";
  case "rep_mult":
    return "Reputation Multiplication";
  case "xp_mult":
    return "Experience Boost";
  case "token_bonus":
    return "Gambling Addiction";
  case "msg_bonus":
    return "Talkative Member";
  case "msg_mult":
    return "Famed Yapper";
  case "voice_bonus":
    return "Regular Gamer";
  case "voice_mult":
    return "Voice Chat Legend";
  default:
    return "Undefined";
  }
}

function displayCharms(charms) {
  if (!charms.length) {
    return "```You have no charms!```";
  }

  return `\`\`\`ansi\n==== Charms ====\n${
    charms
      .map((c) => `• \u001b[${c.colour};000m ${c.name} Charm of ${
        getCharmName(c.effect)
      }\u001b[0m]`)
      .join("\n")
  }\`\`\``;
}

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Ping!"),
  execute(interaction) {
    const guildId = interaction.guild.id;
    const userId = interaction.user.id;
    const { charms } = globalThis.stats[guildId][userId];

    interaction.reply(`Pong! ${interaction.client.ws.ping}ms`);
  }
};
