"use strict";

const { botResponseChance } = require("../resources/config.json");
const responses = require("../resources/responses.json");
const { getNicknameMsg } = require("../util/common.js");

async function checkMessageResponse(msg) {
  // Swap Twitter/X URLs for proper embedding ones
  if (
    ["https://x.com/", "https://twitter.com/"].find((l) =>
      msg.content.includes(l)) &&
    msg.content.includes("status")
  ) {
    const content = `${getNicknameMsg(msg)} sent:\n${msg.content
      .replace("https://x.com/", "https://fixupx.com/")
      .replace("https://twitter.com/", "https://fxtwitter.com/")}`;

    if (msg.reference && msg.reference.channelId === msg.channel.id) {
      const replyMsg = await msg.channel.messages.fetch(
        msg.reference.messageId
      );
      replyMsg.reply(content);
    } else {
      msg.channel.send(content);
    }

    await msg.delete()
      .catch(console.error);
    return;
  }

  const steamLinkRegex = /https:\/\/steamcommunity\.com\S*/gu;
  // Swap steamcommunity links for openable ones
  if (steamLinkRegex.test(msg.content)) {
    const steamLink =
      msg.content.split(" ")
        .find((m) => steamLinkRegex.test(m)) ?? msg.content;
    msg.channel.send(
      /* eslint-disable-next-line max-len */
      `Embedded link: https://yakasov.github.io/pages/miscellaneous/steam_direct.html?page=${encodeURIComponent(steamLink)}`
    );
  }

  async function f(k, v) {
    let res = v;
    if (res.includes("{AUTHOR}")) {
      res = res.replace("{AUTHOR}", getNicknameMsg(msg));
    }

    if (res.includes("{FOLLOWING}")) {
      let lastMsg = "";
      if (
        msg.content.toLowerCase()
          .trim() === k ||
        msg.content.toLowerCase()
          .trim()
          .endsWith(k)
      ) {
        lastMsg = await msg.channel.messages
          .fetch({
            limit: 2
          })
          .then((c) => getNicknameMsg([...c.values()].pop()));
      }

      const following = msg.content.toLowerCase()
        .split(k)
        .slice(1)
        .join(k);
      res = res.replace(
        "{FOLLOWING}",
        lastMsg || !following.trim()
          ? lastMsg ?? getNicknameMsg(msg)
          : following.trim()
      );
    }

    if (res.includes("{STICKER:")) {
      const stickerId = res.split(":")[1].slice(0, -1);
      const sticker = msg.guild.stickers.cache.filter(
        (s) => s.id === stickerId
      );
      if (sticker.size) {
        return msg.channel.send({
          stickers: sticker
        });
      }
      return null;
    }

    return msg.channel.send(res);
  }

  const entries = Object.entries(responses);
  for (let i = 0; i < entries.length; i++) {
    const [k, v] = entries[i];
    if (` ${msg.content.toLowerCase()} `.includes(` ${k} `)) {
      /* eslint-disable-next-line consistent-return */
      return f(k, v);
    }
  }
}

async function checkMessageReactions(msg) {
  // Fix for deleted message - return if message fetch fails
  try {
    await msg.channel.messages.fetch(msg.id);
  } catch {
    return;
  }

  const roll = Math.random() * 100;
  const initialRoll = Math.random() * 100;

  if (initialRoll < (botResponseChance ?? 0)) {
    Object.values(globalThis.rollTable)
      .some((response) => {
        if (roll < response.chance) {
          try {
            switch (response.type) {
            case "message":
              msg.reply(response.string);
              break;

            case "react":
              msg.react(response.string);
              break;

            default:
              break;
            }

            return true;
          } catch (e) {
            console.error(e);
            return false;
          }
        }

        return false;
      });
  }
}

module.exports = {
  checkMessageReactions,
  checkMessageResponse
};
