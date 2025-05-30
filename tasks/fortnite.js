"use strict";

const { mainGuildId, fortniteChannelId } = require("../resources/config.json");

let currentSongs = [];
const emoteFlags = {
  "Bring It Around": false,
  "Get Griddy": false,
};

async function getFortniteShop() {
  try {
    const response = await fetch("https://fortnite-api.com/v2/shop");
    if (!response.ok) {
      console.error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching Fortnite shop:", error);
    return null;
  }
}

exports.run = async (client) => {
  const data = await getFortniteShop();
  const songs = data.entries
    .filter((e) => e.layout.name === "Jam Tracks")
    .map((e) => `${e.tracks[0].title} - ${e.tracks[0].artist}`);
  const emotes = data.entries
    .filter((e) => e.brItems && e.brItems[0].type.value === "emote")
    .map((e) => e.brItems[0].name);

  const guild = await client.guilds.fetch(mainGuildId);
  const fortniteChannel = await guild.channels.fetch(fortniteChannelId);

  const emoteMessages = {
    "Bring It Around": "The Homer Simpson dance is now in the Fortnite shop!",
    "Get Griddy": "Get Griddy is now in the Fortnite shop!",
  };

  for (const emote in emoteFlags) {
    if (emotes.includes(emote) && !emoteFlags[emote]) {
      emoteFlags[emote] = true;
      fortniteChannel.send(emoteMessages[emote]);
    } else if (!emotes.includes(emote)) {
      emoteFlags[emote] = false;
    }
  }

  if (currentSongs.length === 0) {
    currentSongs = songs;
    return;
  }

  const newSongs = songs.filter((s) => !currentSongs.includes(s));
  const oldSongs = currentSongs.filter((s) => !songs.includes(s));
  if (newSongs.length > 0 || oldSongs.length > 0) {
    currentSongs = songs;
    if (oldSongs.length > 0) {
      fortniteChannel.send(
        `Removed Fortnite Jam Tracks:\n${oldSongs.join("\n")}`
      );
    }

    if (newSongs.length > 0) {
      fortniteChannel.send(`New Fortnite Jam Tracks:\n${newSongs.join("\n")}`);
    }
  }
};
