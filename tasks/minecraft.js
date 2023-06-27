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
        activityString = `(${players.length}) ${players.join(", ")}`;
      }

      client.user.setPresence({
        activities: [{ name: activityString, type: ActivityType.Watching }],
      });
    })
    .catch((e) => {
      return;
    });
};
