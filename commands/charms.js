"use strict";

const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  SlashCommandBuilder
} = require("discord.js");

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
    .addComponents(
      ...buttons
    );
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
