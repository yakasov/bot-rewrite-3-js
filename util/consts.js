"use strict";

module.exports = {
  AI_DEFAULT_TEMP: 0.9,
  AI_MAX_TOKENS: 4096,
  AI_MODEL: "gpt-4o-mini",
  AI_REQUEST_ATTEMPTS: 3,
  BASIC_JSON_FILES: [
    "./resources/birthdays.json",
    "./resources/chanceResponses.json",
    "./resources/mtg/mtgCache.json",
    "./resources/mtg/mtgCards.json",
    "./resources/stats.json",
    "./resources/ranks.json",
    "./resources/roles.json",
  ],
  BOT_CHANNEL_ID: "1087133384758792272",
  DISCORD_ID_LENGTH: 18,
  DISCORD_VOICE_CHANNEL_TYPE: 2,
  MTG_PACK_SIZE: 12,
  SPAM_CHANNEL_ID: "485003783399669762",
  TOP_SCORES_N: 10,
  YT_MAX_AUDIO_SIZE: 33554432,
};
