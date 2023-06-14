const { ActivityType } = require("discord.js");
const { queryFull } = require("minecraft-server-util");
const {
  minecraftServerIp,
  minecraftServerPort,
} = require("./../resources/config.json");

exports.run = async (client, splash) => {
  if (!(minecraftServerIp && minecraftServerPort)) return;

  queryFull(minecraftServerIp, minecraftServerPort)
    .then(async (res) => {
      const online = res.players.online;
      var activityString;
      if (!online) {
        if (client.user.presence.activities[0].name === splash) return;
        // if nobody is online and the splash is already set, don't set it again
        
        activityString = splash;
      } else {
        const players = res.players.list;
        const playersString =
          players.length > 1
            ? players.map((e) => e.substring(0, 5).toUpperCase()).join(", ")
            : players[0];

        activityString = `(${players.length}) ${playersString}`;
      }

      client.user.setPresence({
        activities: [{ name: activityString, type: ActivityType.Watching }],
      });
    })
    .catch((e) => {
      return;
    });
};
