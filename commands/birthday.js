"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { mainGuildId, bdayRoleId } = require("../resources/config.json");
const { BOT_CHANNEL_ID, SPAM_CHANNEL_ID } = require("../util/consts");

function isBirthdayUser(interaction) {
  const role = interaction.guild.roles.cache.get(bdayRoleId);
  if (!role) {
    return false;
  }
  const isRoleMember = role.members.has(interaction.user.id);
  const isOwner =
    interaction.user.id === interaction.client.application.owner.id;
  return isRoleMember || isOwner;
}

async function setBotNickname(interaction, value) {
  const botMember = await interaction.guild.members.fetch(
    interaction.client.user.id
  );
  await botMember.setNickname(value);
}

async function setChannelName(interaction, channelId, value) {
  const channel = await interaction.guild.channels.fetch(channelId);
  if (channel) {
    await channel.setName(value);
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("birthday")
    .setDescription("Birthday functions for the birthday person!")
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription(
          "Whether to set the bot name, server name or owner name"
        )
        .setRequired(true)
        .addChoices(
          { name: "Bot name", value: "bot" },
          { name: "Server name", value: "server" },
          { name: "Owner name", value: "owner" },
          { name: "Spam channel name", value: "channel" }
        ))
    .addStringOption((opt) =>
      opt
        .setName("value")
        .setDescription("What to set the name to")
        .setRequired(true)
        .setMinLength(1)
        .setMaxLength(32)),
  async execute(interaction) {
    if (interaction.guild.id !== mainGuildId) {
      return;
    }

    if (!isBirthdayUser(interaction)) {
      return interaction.reply({
        content: "It is not your birthday!",
        ephemeral: true
      });
    }

    const option = interaction.options.getString("type");
    const value = interaction.options.getString("value");

    try {
      switch (option) {
      case "bot":
        await setBotNickname(interaction, value);
        await setChannelName(
          interaction,
          BOT_CHANNEL_ID,
          `chat-with-${value}`
        );
        break;
      case "server":
        await interaction.guild.setName(value);
        break;
      case "owner":
        return interaction.reply({
          content:
              "Due to Discord limitations, this is not possible :(\nPlease message me instead!",
          ephemeral: true
        });
      case "channel":
        await setChannelName(interaction, SPAM_CHANNEL_ID, value);
        break;
      default:
        return interaction.reply({
          content: "Not implemented yet...",
          ephemeral: true
        });
      }

      return interaction.reply({
        content: `Set ${option} name successfully!`,
        ephemeral: true
      });
    } catch (e) {
      return interaction.reply({
        content: `Error: ${e.message}`,
        ephemeral: true
      });
    }
  }
};
