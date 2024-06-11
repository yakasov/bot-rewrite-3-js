"use strict";

module.exports = {
  "getNicknameInteraction": (interaction, id) => {
    const member = interaction.guild.members.cache
      .filter((m) => m.id === id)
      .first();
    return `${member ? member.displayName : "???"}`;
  },
  "getNicknameMsg": (msg) => {
    const member = msg.guild.members.cache.filter((m) => m.id === msg.author.id)
      .first();
    return `${member ? member.displayName : "???"}`;
  }
};