"use strict";

const { SlashCommandBuilder } = require("discord.js");
const { statsConfig } = require("../resources/config.json");
const wait = require("node:timers/promises").setTimeout;

module.exports = {
  "data": new SlashCommandBuilder()
    .setName("rep")
    .setDescription("Give (or take) reputation from someone")
    .addStringOption((opt) =>
      opt
        .setName("type")
        .setDescription("Whether to give or take reputation")
        .setRequired(true)
        .addChoices({ "name": "+",
          "value": "+" }, { "name": "-",
          "value": "-" }))
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to give or take reputation from")
        .setRequired(true)),
  async execute(interaction) {
    await interaction.deferReply({ "ephemeral": true });
    await interaction.client.application.fetch();

    const type = interaction.options.getString("type");
    const user = interaction.options.getUser("user");
    const userMemberObject = await interaction.guild.members
      .fetch()
      .then((members) => members.filter((m) => m.id === user.id)
        .first());
    const giver = interaction.member;
    const amount =
      (1 + globalThis.stats[interaction.guild.id][giver.id].prestige) *
      (type === "+"
        ? 1
        : -1);

    // Do not allow giving reputation to yourself
    if (user.id === giver.id) {
      return interaction.followUp("You cannot give reputation to yourself!");
    }

    // Do not run the command if the cooldown is not over
    if (
      module.exports.f() -
        globalThis.stats[interaction.guild.id][giver.id].reputationTime <
      statsConfig.reputationGainCooldown
    ) {
      return interaction.followUp(
        `You need to wait ${
          statsConfig.reputationGainCooldown -
          (module.exports.f() -
            globalThis.stats[interaction.guild.id][giver.id].reputationTime)
        } more seconds first!`
      );
    }

    globalThis.stats[interaction.guild.id][user.id].reputation += amount;
    globalThis.stats[interaction.guild.id][giver.id].reputationTime =
      module.exports.f();

    if (globalThis.stats[interaction.guild.id][user.id].reputation >= 100) {
      globalThis.stats[interaction.guild.id][user.id].reputation = -99;
    } else if (
      globalThis.stats[interaction.guild.id][user.id].reputation <= -100
    ) {
      globalThis.stats[interaction.guild.id][user.id].reputation = 99;
    }

    await interaction.followUp(
      `Reputation ${type === "+"
        ? "adding"
        : "removing"} successful!`
    );
    await interaction.followUp({
      "content": `${giver.displayName} has given ${amount} rep to ${userMemberObject}!`,
      "ephemeral": false
    });

    await wait(statsConfig.reputationGainCooldown * 1000);
    return interaction.followUp({
      "content": "Your reputation cooldown has expired!",
      "ephemeral": true
    });
  },
  "f": () => Math.floor(Date.now() / 1000)
};
