"use strict";

const {
  mainGuildId,
  fortniteChannelId,
} = require("../resources/config.json");

let currentSongs = [];

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
  const songs = data.entries.filter((e) => e.layout.name === "Jam Tracks")
    .map((e) => `${e.tracks[0].title  } - ${  e.tracks[0].artist}`);

  const guild = await client.guilds.fetch(mainGuildId);
  const fortniteChannel = await guild.channels.fetch(fortniteChannelId);

  if (currentSongs.length === 0) {
    currentSongs = songs;
    return;
  }

  const newSongs = songs.filter((s) => !currentSongs.includes(s));
  if (newSongs.length > 0) {
    currentSongs = songs;
    fortniteChannel.send(`New Fortnite Jam Tracks:\n${newSongs.join("\n")}`);
  }
};