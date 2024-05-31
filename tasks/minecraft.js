"use strict";

const { ActivityType } = require("discord.js");
const { queryFull, status } = require("minecraft-server-util");
const {
  minecraftServerIp,
  minecraftServerPort
} = require("../resources/config.json");

exports.run = (client, splash) => {
  if (!(minecraftServerIp && minecraftServerPort)) {
    if (globalThis.firstRun.minecraft) {
      console.log("No IP and/or Port for Minecraft server query!");
      globalThis.firstRun.minecraft = false;
    }

    return;
  }

  if (globalThis.firstRun.minecraft) {
    console.log(
      `Using ${
        minecraftServerIp
      }:${
        minecraftServerPort
      } for Minecraft query...\n`
    );

    status(minecraftServerIp, minecraftServerPort)
      .then((res) => {
        if (res) {
          console.log(
            `\nFound Minecraft server! Latency: ${res.roundTripLatency}`
          );
        }
      })
      .catch((e) => {
        console.log(`\n${e}`);
      });

    globalThis.firstRun.minecraft = false;
  }

  queryFull(minecraftServerIp, minecraftServerPort)
    .then((res) => {
      const online = res.players;
      let activityString = "";
      if (online) {
        const players = res.players.list;
        activityString = `(${players.length}) ${players.join(", ")}`;
      } else {
        // If nobody is online and the splash is already set, don't set it again
        if (client.user.presence.activities[0].name === splash) {
          return;
        }

        activityString = splash;
      }

      client.user.setPresence({
        "activities": [
          { "name": activityString,
            "type": ActivityType.Watching }
        ]
      });
    })
    .catch(() => {
      // No catch (hmm...)
    });
};
