"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { status } = require("minecraft-server-util");
const {
  minecraftServerIp,
  minecraftServerPort,
} = require("../resources/config.json");
const { wrapCodeBlockString } = require("../util/common");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("mcstatus")
    .setDescription("Get information about the current Minecraft server"),
  execute(interaction) {
    if (!(minecraftServerIp.length && minecraftServerPort)) {
      return interaction.reply("There is no current Minecraft server set up!");
    }

    return status(minecraftServerIp, minecraftServerPort)
      .then(async (res) => {
        // Favicon is a base64 encoded image, remove it
        res.favicon = null;
        await interaction.reply(
          wrapCodeBlockString(JSON.stringify(res, null, 4))
        );
      })
      .catch((err) => {
        console.error(err);
      });
  },
};
