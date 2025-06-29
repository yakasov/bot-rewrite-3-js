"use strict";

const { MessageFlags } = require("discord.js");

const reply = {
  content: "There was an error while executing this command!",
  flags: MessageFlags.Ephemeral
};

async function handleInteractionCreate(interaction) {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(reply);
    } else {
      await interaction.reply(reply);
    }
  }
}

module.exports = { handleInteractionCreate };
