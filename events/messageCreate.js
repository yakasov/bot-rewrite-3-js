"use strict";

const checkAchievements = require("../util/achievements.js");
const globals = require("../util/globals.js");
const {
  checkMessageResponse,
  checkMessageReactions,
} = require("../util/messageHandlers.js");
const { checkScryfallMessage } = require("../util/mtg/scryfallMessageHandlers");
const { addToStats } = require("../util/stats");

async function handleMessageCreate(message) {
  if (!message.author.bot) {
    await checkScryfallMessage(message);
  }

  if (message.author.bot || !message.guild) {
    return;
  }

  await checkMessageResponse(message);

  const guildStats = globals.get("stats")[message.guild.id];
  if (guildStats && (guildStats.allowResponses ?? true)) {
    await checkMessageReactions(message);
  }

  addToStats({
    guildId: message.guild.id,
    type: "message",
    userId: message.author.id,
  });

  checkAchievements.run(message);
}

module.exports = { handleMessageCreate };
