"use strict";

const globals = require("../globals");

async function sendMessage(messageArgs) {
  const [guildId,
    userId,
    subject,
    accolade,
    title] = messageArgs;
  const guildObject = await globalThis.client.guilds.fetch(guildId);
  const userObject = guildObject.members.cache
    .filter((m) => m.id === userId)
    .first();
  const guildStats = globals.get("stats")[guildId];

  // Fix for .displayName on empty user object
  if (!userObject) {
    console.warn(`userObject for userId ${userId} was null!`);
    return;
  }

  /*
   * (Temporary) fix for multiple prestige messages where one breaks
   * I'm not sure why this happens just yet
   */
  if (accolade === "MISSINGNO") {
    console.warn(`Retrieved accolade was MISSINGNO for userId ${userId}!`);
    return;
  }

  const channel = await guildObject.channels.fetch(guildStats.rankUpChannel);

  /*
   * Channel can be fetched with an undefined snowflake
   * if this happens, a list of channels is returned instead.
   * Because we don't want this, we double check that rankUpChannel
   * is *actually* set, even though we already 'fetched' it.
   *
   * Prestiging / ranking up can still happen silently without
   * a rankUpChannel being explicitly set.
   */
  if (channel && guildStats.rankUpChannel) {
    channel.send(
      `## ${subject}!\n\`\`\`ansi\n${userObject.displayName} has reached ${accolade} (${title})!\`\`\``
    );
  }
}

module.exports = {
  sendMessage,
};
