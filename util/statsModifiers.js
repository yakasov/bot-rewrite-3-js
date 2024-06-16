"use strict";

/*
 * The plan here is to override functions defined in stats.js.
 *
 * This allows me to apply 'seasonal modifiers' without messing with
 * the core functions - the modifiers will only apply to mainGuild.
 * 
 * Essentially, if guildId === mainGuildId, use 'statsModifiers.func'
 * instead of 'stats.func'.
 */

module.exports = {
  updateNerdCoolScores: (guildId, userId) => {},

  updateScoreValue: (guildId, userId) => {},

  updateScores: () => {},

  updateStatsOnPrestige: (userStats) => {}
};