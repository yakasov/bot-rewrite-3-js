"use strict";

const fs = require("fs"); 
const path = require("node:path");

module.exports = function loadCommands(client) {
  client.commands ||= new (require("discord.js").Collection)();

  // __dirname is undefined if using ES but this is a CommonJS module
  /* eslint-disable-next-line no-undef */
  const commandsPath = path.join(__dirname, "..", "commands");
  const commandFiles = fs
    .readdirSync(commandsPath)
    .filter((file) => file.endsWith(".js"));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);

    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.warn(
        `[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
      );
    }
  }
};