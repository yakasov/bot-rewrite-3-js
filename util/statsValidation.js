"use strict";

const globals = require("./globals.js");

//Validates guild and user stats existence for command interactions
function validateStats(interaction, userId = null) {
  const guildId = interaction.guild.id;
  const targetUserId = userId || interaction.user.id;
  const allStats = globals.get("stats");
  
  // Check if guild has any stats
  if (!allStats || !allStats[guildId]) {
    return {
      success: false,
      guildStats: null,
      userStats: null,
      errorMessage: "This server has no statistics yet!"
    };
  }
  
  const guildStats = allStats[guildId];
  
  // Check if user has stats
  if (!guildStats[targetUserId]) {
    const isRequestingUser = targetUserId === interaction.user.id;
    const errorMessage = isRequestingUser 
      ? "You don't have any stats yet!"
      : "This user has no statistics yet!";
    
    return {
      success: false,
      guildStats,
      userStats: null,
      errorMessage
    };
  }
  
  return {
    success: true,
    guildStats,
    userStats: guildStats[targetUserId],
    errorMessage: null
  };
}

//Validates only guild stats existence (for admin commands)
function validateGuildStats(interaction) {
  const guildId = interaction.guild.id;
  const allStats = globals.get("stats");
  
  if (!allStats || !allStats[guildId]) {
    return {
      success: false,
      guildStats: null,
      errorMessage: "This server has no statistics yet!"
    };
  }
  
  return {
    success: true,
    guildStats: allStats[guildId],
    errorMessage: null
  };
}

//Ensures guild stats exist, creating them if necessary
function ensureGuildStats(interaction) {
  const guildId = interaction.guild.id;
  const allStats = globals.get("stats");
  
  if (!allStats[guildId]) {
    allStats[guildId] = {
      allowResponses: true,
      rankUpChannel: "",
    };
  }
  
  return allStats[guildId];
}

module.exports = {
  validateStats,
  validateGuildStats,
  ensureGuildStats,
}; 