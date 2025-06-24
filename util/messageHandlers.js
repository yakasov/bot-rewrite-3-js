"use strict";

const { botResponseChance } = require("../resources/config.json");
const chanceResponses = require("../resources/chanceResponses.json");
const responses = require("../resources/responses.json");
const { getNicknameFromMessage } = require("../util/common.js");
const {
  THIS_ID_IS_ALWAYS_LATE_TELL_HIM_OFF,
  REGEX_STEAM_LINK,
  REGEX_TIME_MATCH,
  STEAM_URL_LINK,
} = require("./consts.js");
const globals = require("./globals.js");

async function swapTwitterLinks(message) {
  const content = `${getNicknameFromMessage(message)} sent:\n${message.content
    .replace("https://x.com/", "https://fixupx.com/")
    .replace("https://twitter.com/", "https://fxtwitter.com/")}`;

  if (message.reference && message.reference.channelId === message.channel.id) {
    const replyMessage = await message.channel.messages.fetch(
      message.reference.messageId
    );
    replyMessage.reply(content);
  } else {
    message.channel.send(content);
  }

  await message.delete()
    .catch(console.error);
}

function addSteamDirectLink(message) {
  const steamLink =
    message.content.split(" ")
      .find((word) => REGEX_STEAM_LINK.test(word)) ??
    message.content;
  message.channel.send(
    `Embedded link: ${STEAM_URL_LINK}${encodeURIComponent(steamLink)}`
  );
}

function replyWithHypeMessage(message) {
  const hypeEntries = Object.entries(chanceResponses)
    .filter(([key]) =>
      key.includes("hype"));
  const randomEntry =
    hypeEntries[Math.floor(Math.random() * hypeEntries.length)][1].string;
  return message.channel.send(randomEntry);
}

async function sendCustomResponse(message, key, value) {
  let response = value;
  if (response.includes("{AUTHOR}")) {
    response = response.replace("{AUTHOR}", getNicknameFromMessage(message));
  }

  if (response.includes("{FOLLOWING}")) {
    let lastMessage = "";
    if (
      message.content.toLowerCase()
        .trim() === key ||
      message.content.toLowerCase()
        .trim()
        .endsWith(key)
    ) {
      lastMessage = await message.channel.messages
        .fetch({ limit: 2 })
        .then((c) => getNicknameFromMessage([...c.values()].pop()));
    }

    const following = message.content
      .toLowerCase()
      .split(key)
      .slice(1)
      .join(key);
    response = response.replace(
      "{FOLLOWING}",
      lastMessage || !following.trim()
        ? lastMessage ?? getNicknameFromMessage(message)
        : following.trim()
    );
  }

  if (response.includes("{STICKER:")) {
    const stickerId = response.split(":")[1].slice(0, -1);
    const stickerObject = message.guild.stickers.cache.filter(
      (sticker) => sticker.id === stickerId
    );
    if (stickerObject.size) {
      return message.channel.send({ stickers: stickerObject });
    }
    return null;
  }

  return message.channel.send(response);
}

async function checkMessageResponse(message) {
  if (REGEX_STEAM_LINK.test(message.content)) {
    return addSteamDirectLink(message);
  }

  // Swap Twitter/X URLs for proper embedding ones
  if (
    ["https://x.com/", "https://twitter.com/"].some((link) =>
      message.content.includes(link)) &&
    message.content.includes("status")
  ) {
    return await swapTwitterLinks(message);
  }

  if (
    message.author.id === THIS_ID_IS_ALWAYS_LATE_TELL_HIM_OFF &&
    message.content.match(REGEX_TIME_MATCH)
  ) {
    return replyWithHypeMessage(message);
  }

  // Custom responses
  for (const [key, value] of Object.entries(responses)) {
    if (` ${message.content.toLowerCase()} `.includes(` ${key} `)) {
      await sendCustomResponse(message, key, value);
      return;
    }
  }
}

async function checkMessageReactions(message) {
  // Fix for deleted message - return if message fetch fails
  try {
    await message.channel.messages.fetch(message.id);
  } catch {
    return;
  }

  const roll = Math.random() * 100;
  const initialRoll = Math.random() * 100;

  if (initialRoll < (botResponseChance ?? 0)) {
    Object.values(globals.get("rollTable"))
      .some((response) => {
        if (roll < response.chance) {
          try {
            switch (response.type) {
            case "message":
              message.reply(response.string);
              break;
            case "react":
              message.react(response.string);
              break;
            default:
              break;
            }
            
            return true;
          } catch (err) {
            console.error(err);
            return false;
          }
        }
        return false;
      });
  }
}

module.exports = {
  checkMessageReactions,
  checkMessageResponse,
};
