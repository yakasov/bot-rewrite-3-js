"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { status } = require("minecraft-server-util");
const {
  minecraftServerIp,
  minecraftServerPort,
  minecraftServerOwnerId
} = require("./../resources/config.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mcstatus")
    .setDescription("Get information about the current Minecraft server"),
  async execute(interaction) {
    if (!(minecraftServerIp.length && minecraftServerPort)) {
      return interaction.reply(
        "There is no current Minecraft server set up!"
      );
    }

    return status(minecraftServerIp, minecraftServerPort)
      .then(async (res) => {
        // Favicon is a base64 encoded image, remove it
        res.favicon = null;
        await interaction.reply(
          `\`\`\`\n${JSON.stringify(res, null, 4)}\n\`\`\``
        );
      })
      .catch(async (e) => {
        let str = e.message;

        if (e.errno && e.errno === -4078) {
          str += `\n<@${minecraftServerOwnerId}>`;
        }

        await interaction.reply(str);
      });
  }
};
