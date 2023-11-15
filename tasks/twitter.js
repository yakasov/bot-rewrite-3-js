const fs = require("fs");
const { parse } = require("node-html-parser");
const {
  mainGuildId,
  twitterUrl,
  twitterChannelId,
} = require("./../resources/config.json");

module.exports = {
  run: async (client) => {
    if (!twitterUrl) return;

    const keywords = [
      "patch",
      "bug",
      "tweak",
      "balance",
      "change",
      "nerf",
      "buff",
    ];
    const twitterPage = await fetch(twitterUrl, {
      redirect: "follow",
      follow: 100,
    })
      .then(function (res) {
        if (res.status == 200) {
          return res.text();
        }
        throw res;
      })
      .catch(function (res) {
        console.warn(
          `${new Date().toJSON()}: ${twitterUrl} => ${res.status}: ${
            res.statusText
          }`
        );
        return null;
      });

    if (!twitterPage) return;

    var existingLinks = module.exports.getLinks();
    const parsedPage = parse(twitterPage);
    const allEls = parsedPage.querySelectorAll("*");
    const tweets = allEls.filter((el) => el.rawAttrs == 'class="tweet-body"');

    const guild = await client.guilds.fetch(mainGuildId);
    const twitterChannel = await guild.channels.fetch(twitterChannelId);

    tweets.forEach((t) => {
      var bodyText;
      const body = t.childNodes.filter(
        (el) => el.rawAttrs == 'class="tweet-content media-body" dir="auto"'
      );
      body[0].childNodes.forEach((e) => {
        if (e._rawText) {
          bodyText += e._rawText;
        }
      });

      if (
        bodyText &&
        bodyText.length &&
        !keywords.some((k) => bodyText.toLowerCase().includes(k))
      )
        return;

      const linkEl = t.parentNode.childNodes.filter(
        (el) => el.rawAttrs && el.rawAttrs.includes("tweet-link")
      )[0].rawAttrs;
      const link =
        "https://fxtwitter.com" + linkEl.substring(25, linkEl.length - 3);

      if (!existingLinks.includes(link)) {
        twitterChannel.send(link);
        existingLinks = existingLinks.concat(link);
      }
    });

    module.exports.writeLinks(existingLinks);
  },
  getLinks: () => {
    return fs.readFileSync("./tasks/twitter.urls").toString().split("\n");
  },
  writeLinks: (links) => {
    const linkString = links.join("\n");
    return fs.writeFileSync("./tasks/twitter.urls", linkString);
  },
};
