"use strict";

const { ActivityType } = require("discord.js");
const { queryFull } = require("minecraft-server-util");
const {
  minecraftServerIp,
  minecraftServerPort
} = require("../resources/config.json");

exports.run = (client, splash) => {
  if (!(minecraftServerIp && minecraftServerPort)) {
    return;
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
