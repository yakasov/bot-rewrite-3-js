"use strict";

const { ActivityType } = require("discord.js");
const { queryFull, status } = require("minecraft-server-util");
const {
  minecraftServerIp,
  minecraftServerPort
} = require("../resources/config.json");

exports.run = (client, splash) => {

  /*
   * 0 - Minecraft has been run at least once
   * 1 - Minecraft has not yet been run (is on first run)
   * 2 - Minecraft errored and should not be queried again
   */
  if (globalThis.firstRun.minecraft === 2) {
    return;
  }

  if (!(minecraftServerIp && minecraftServerPort)) {
    if (globalThis.firstRun.minecraft === 1) {
      console.error("No IP and/or Port for Minecraft server query!");
      globalThis.firstRun.minecraft = 2;
    }

    return;
  }

  if (globalThis.firstRun.minecraft === 1) {
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

        globalThis.firstRun.minecraft = 0;
      })
      .catch((e) => {
        console.error(`\n${e}`);
        globalThis.firstRun.minecraft = 2;
        console.warn(
          `globalThis.firstRun.minecraft is set to state ${
            globalThis.firstRun.minecraft
          }, Minecraft will not be queried again this session`
        );
      });
  }

  queryFull(minecraftServerIp, minecraftServerPort)
    .then((res) => {
      const { online } = res.players;
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
