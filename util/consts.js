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
    "./resources/roles.json"
  ],
  BOT_CHANNEL_ID: "1087133384758792272",
  DISCORD_ID_LENGTH: 18,
  DISCORD_VOICE_CHANNEL_TYPE: 2,
  MTG_PACK_SIZE: 12,
  REGEX_DISCORD_MESSAGE_LENGTH: /[\s\S]{1,2000}(?!\S)/gu,
  REGEX_DISCORD_MESSAGE_LENGTH_SHORT: /[\s\S]{1,1980}(?!\S)/gu,
  // eslint-disable-next-line no-control-regex
  REGEX_SANITIZE_STRING: /[^\x00-\x7F]/gu,
  REGEX_SCRYFALL_PATTERN: /\[\[(?<card>[^|\]]+?)(?:\|{1,2}(?<set>[^\]]+))?\]\]/gu,
  REGEX_STEAM_LINK: /https:\/\/steamcommunity\.com\S*/gu,
  REGEX_TIME_MATCH: /\b\d+\s*:\s*\d+\b/gu,
  REGEX_YOUTUBE_URL_FULL: /^https?:\/\/(?<subdomain>www\.)?youtube\.com\/watch\?v=/gu,
  REGEX_YOUTUBE_URL_SHORT: /^https?:\/\/youtu\.be\//gu,
  SPAM_CHANNEL_ID: "485003783399669762",
  STEAM_URL_LINK: "https://yakasov.github.io/pages/miscellaneous/steam_direct.html?page=",
  THIS_ID_IS_ALWAYS_LATE_TELL_HIM_OFF: "135410033524604928",
  TOP_SCORES_N: 10,
  YT_MAX_AUDIO_SIZE: 33554432
};
