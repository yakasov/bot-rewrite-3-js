"use strict";

const { Cards } = require("scryfall-api");
const { AttachmentBuilder, EmbedBuilder } = require("discord.js");
const { botResponseChance } = require("../resources/config.json");
const chanceResponses = require("../resources/chanceResponses.json");
const responses = require("../resources/responses.json");
const { getNicknameFromMessage } = require("../util/common.js");
const { THIS_ID_IS_ALWAYS_LATE_TELL_HIM_OFF } = require("./consts.js");
const globals = require("./globals.js");
const { combineImages } = require("./mtg/boosterHelper.js");

// Move to consts?
const steamLinkRegex = /https:\/\/steamcommunity\.com\S*/gu;

async function swapTwitterLinks(msg) {
  const content = `${getNicknameFromMessage(msg)} sent:\n${msg.content
    .replace("https://x.com/", "https://fixupx.com/")
    .replace("https://twitter.com/", "https://fxtwitter.com/")}`;

  if (msg.reference && msg.reference.channelId === msg.channel.id) {
    const replyMsg = await msg.channel.messages.fetch(msg.reference.messageId);
    replyMsg.reply(content);
  } else {
    msg.channel.send(content);
  }

  await msg.delete()
    .catch(console.error);
}

function addSteamDirectLink(msg) {
  const steamLink =
      msg.content.split(" ")
        .find((m) => steamLinkRegex.test(m)) ?? msg.content;
  msg.channel.send(
    /* eslint-disable-next-line max-len */
    `Embedded link: https://yakasov.github.io/pages/miscellaneous/steam_direct.html?page=${encodeURIComponent(steamLink)}`
  );
}

function replyWithHypeMessage(msg) {
  const hypeEntries = Object.entries(chanceResponses)
    .filter(([key]) =>
      key.includes("hype"));
  const randomEntry =
    hypeEntries[Math.floor(Math.random() * hypeEntries.length)][1].string;
  return msg.channel.send(randomEntry);
}

async function checkMessageResponse(msg) {
  if (steamLinkRegex.test(msg.content)) {
    addSteamDirectLink(msg);
  }

  // Swap Twitter/X URLs for proper embedding ones
  if (
    ["https://x.com/", "https://twitter.com/"].find((l) =>
      msg.content.includes(l)) &&
    msg.content.includes("status")
  ) {
    return await swapTwitterLinks(msg);
  }

  if (
    msg.author.id === THIS_ID_IS_ALWAYS_LATE_TELL_HIM_OFF &&
    msg.content.match(/\b\d+\s*:\s*\d+\b/gu)
  ) {
    return replyWithHypeMessage(msg);
  }

  /*
   * I don't really like this function method
   * but I have yet to figure out a *better* way
   * of doing this as simply as this
   *
   * I can split each check into different functions
   * but not sure it's worth it, might just make it
   * more verbose
   */
  async function f(k, v) {
    let res = v;
    if (res.includes("{AUTHOR}")) {
      res = res.replace("{AUTHOR}", getNicknameFromMessage(msg));
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
            limit: 2,
          })
          .then((c) => getNicknameFromMessage([...c.values()].pop()));
      }

      const following = msg.content.toLowerCase()
        .split(k)
        .slice(1)
        .join(k);
      res = res.replace(
        "{FOLLOWING}",
        lastMsg || !following.trim()
          ? (lastMsg ?? getNicknameFromMessage(msg))
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
          stickers: sticker,
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
    Object.values(globals.get("rollTable"))
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

async function checkScryfallMessage(message) {
  if (message.author.id === "268547439714238465") {
    if (message?.embeds[0]?.data?.description?.includes("Multiple cards match")) {
      await sendScryfallCardList(message);
    }

    if (message?.embeds[0]?.data?.title?.includes(" // ")) {
      await sendScryfallDoubleSidedCard(message);
    }
  }
}

async function sendScryfallCardList(message) {
  // Check if Scryfall has given a stupid response
  if (
    message.author.id === "268547439714238465" &&
    message?.embeds[0]?.data?.description?.includes("Multiple cards match")
  ) {
    const cardName = message.embeds[0].data.description.match(
      /(?<=Multiple cards match “)(?:.*)(?=”, can you be more specific?)/gu
    )[0];

    if (cardName.length > 1) {
      const results = await Cards.autoCompleteName(cardName);

      /*
       * Sometimes this happens with names like 'miku'
       * I think the Scryfall bot works for all languages
       * whereas AutoCompleteName only works for one at a time
       */
      if (!results.length) {
        return;
      }

      let embedString = "";
      results.forEach((c, i) => {
        embedString += `${i + 1}. ${c}\n`;
      });

      const embed = new EmbedBuilder()
        .setTitle("Scryfall Cards")
        .addFields({
          name: `Returned ${results.length} cards:`,
          value: embedString,
        });

      message.channel.send({ embeds: [embed] });
    }
  }
}

async function sendScryfallDoubleSidedCard(message) {
  const embedData = message.embeds[0].data;
  const cardName = embedData.title;
  const cardDetails = await Cards.byName(cardName);
  
  if (cardDetails.card_faces.length === 2 && cardDetails.card_faces[0].image_uris) {
    const filePath = await combineImages(cardDetails);
    const attachment = new AttachmentBuilder(`${filePath}.jpg`);

    const embed = new EmbedBuilder()
      .setTitle(cardName)
      .setURL(embedData.url)
      .setImage(`attachment://${filePath.split("/")
        .pop()}.jpg`);

    await message.delete()
      .catch(console.error);
    message.channel.send({ embeds: [embed], files: [attachment]  });
  }
}

module.exports = {
  checkMessageReactions,
  checkMessageResponse,
  checkScryfallMessage,
};
