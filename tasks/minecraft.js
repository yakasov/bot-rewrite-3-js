"use strict";

const { ActivityType } = require("discord.js");
const {
  minecraftServerIp,
  minecraftServerPort,
} = require("../resources/config.json");
const globals = require("../util/globals");

/* eslint-disable sort-keys */
/*
 * 0 - Minecraft has been run at least once
 * 1 - Minecraft has not yet been run (is on first run)
 * 2 - Minecraft errored and should not be queried again
 * 3 - Minecraft errored after first query, skip next run
 */
const QueryStates = {
  NORMAL: 0,
  FIRST_RUN: 1,
  ERROR_STOP: 2,
  ERROR_RETRY: 3
};
/* eslint-enable sort-keys */

exports.run = async (client, splash) => {
  const firstRun = globals.get("firstRun");

  if (firstRun.minecraft === QueryStates.ERROR_STOP) {
    return;
  }

  if (firstRun.minecraft === QueryStates.ERROR_RETRY) {
    firstRun.minecraft = QueryStates.NORMAL;
    return;
  }

  if (!(minecraftServerIp && minecraftServerPort)) {
    if (firstRun.minecraft === QueryStates.FIRST_RUN) {
      console.error("\nNo IP and/or Port for Minecraft server query!\n");
      firstRun.minecraft = QueryStates.ERROR_STOP;
    }

    return;
  }

  if (firstRun.minecraft === QueryStates.FIRST_RUN) {
    console.log(
      `\nUsing ${minecraftServerIp}:${
        minecraftServerPort
      } for Minecraft query...\n`
    );

    await fetch(`https://api.mcstatus.io/v2/status/java/${minecraftServerIp}`)
      .then((r) => r.json())
      .then((res) => {
        if (res) {
          console.log(
            `\nFound Minecraft server at ${res.ip_address}:${res.port}!`
          );
        }

        firstRun.minecraft = QueryStates.NORMAL;
      })
      .catch((err) => {
        console.error(`\n${err}`);
        firstRun.minecraft = QueryStates.ERROR_STOP;
        console.warn(
          `firstRun.minecraft is set to state ${
            firstRun.minecraft
          }, Minecraft will not be queried again this session`
        );
      });
  }

  await fetch(`https://api.mcstatus.io/v2/status/java/${minecraftServerIp}`)
    .then((r) => r.json())
    .then((res) => {
      if (!res) {
        return;
      }

      const { online } = res.players ?? 0;
      let activityString = "";
      if (online) {
        const players = res.players.list.map((e) => e.name_raw);
        activityString = `(${players.length}) ${players.join(", ")}`;
      } else {
        // If nobody is online and the splash is already set, don't set it again
        if (client.user.presence.activities[0]?.name === splash) {
          return;
        }

        activityString = splash;
      }

      client.user.setPresence({
        activities: [{ name: activityString, type: ActivityType.Watching }],
      });
    })
    .catch((err) => {
      console.error(`\n${err}`);
      firstRun.minecraft = QueryStates.ERROR_RETRY;
    });
};
