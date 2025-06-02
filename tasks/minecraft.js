"use strict";

const { ActivityType } = require("discord.js");
const {
  minecraftServerIp,
  minecraftServerPort,
} = require("../resources/config.json");

exports.run = async (client, splash) => {
  /*
   * 0 - Minecraft has been run at least once
   * 1 - Minecraft has not yet been run (is on first run)
   * 2 - Minecraft errored and should not be queried again
   * 3 - Minecraft errored after first query, skip next run
   */
  if (globalThis.firstRun.minecraft === 2) {
    return;
  }

  if (globalThis.firstRun.minecraft === 3) {
    globalThis.firstRun.minecraft = 0;
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
      `Using ${minecraftServerIp}:${
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
        if (client.user.presence.activities[0].name === splash) {
          return;
        }

        activityString = splash;
      }

      client.user.setPresence({
        activities: [{ name: activityString, type: ActivityType.Watching }],
      });
    })
    .catch((e) => {
      console.error(`\n${e}`);
      globalThis.firstRun.minecraft = 3;
    });
};
