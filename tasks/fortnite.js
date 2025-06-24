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

function sortSongArray(songA, songB) {
  return songA.split(" - ")[1].localeCompare(songB.split(" - ")[1]);
};

exports.run = async (client) => {
  const data = await getFortniteShop();
  const songs = data.entries
    .filter((entry) => entry.layout.name === "Jam Tracks")
    .map((entry) => `${entry.tracks[0].title} - ${entry.tracks[0].artist}`);
  const emotes = data.entries
    .filter((entry) => entry.brItems && entry.brItems[0].type.value === "emote")
    .map((entry) => entry.brItems[0].name);

  const guild = await client.guilds.fetch(mainGuildId);
  const fortniteChannel = await guild.channels.fetch(fortniteChannelId);

  const emoteMessages = {
    "Bring It Around":
      "**The Homer Simpson dance is now in the Fortnite shop!**",
    "Get Griddy": "**Get Griddy is now in the Fortnite shop!**",
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

  const newSongs = songs.filter((song) => !currentSongs.includes(song));
  const oldSongs = currentSongs.filter((song) => !songs.includes(song));

  newSongs.sort(sortSongArray);
  oldSongs.sort(sortSongArray);

  if (newSongs.length > 0 || oldSongs.length > 0) {
    currentSongs = songs;
    if (oldSongs.length > 0) {
      fortniteChannel.send(
        `# Removed Fortnite Jam Tracks\n${oldSongs.join("\n")}`
      );
    }

    if (newSongs.length > 0) {
      fortniteChannel.send(
        `# New Fortnite Jam Tracks\n${newSongs.join("\n")}`
      );
    }
  }
};
