"use strict";

const { addToStats } = require("../util/stats.js");

module.exports = function handleVoiceStateUpdate(oldState, newState) {
  if (newState.member.bot) {
    return;
  }

  if (oldState.channel && !newState.channel) {
    addToStats({
      guildId: newState.guild.id,
      type: "leftVoiceChannel",
      userId: newState.member.id,
    });
  } else if (!oldState.channel && newState.channel) {
    addToStats({
      guildId: newState.guild.id,
      type: "joinedVoiceChannel",
      userId: newState.member.id,
    });
  }
};
