const { ActivityType } = require("discord.js");
const { queryFull } = require("minecraft-server-util");
const {
  minecraftServerIp,
  minecraftServerPort,
} = require("./../resources/config.json");

exports.run = async (client) => {
  if (!(minecraftServerIp && minecraftServerPort)) return;

  queryFull(minecraftServerIp, minecraftServerPort)
    .then(async (res) => {
      const online = res.players.online;
      if (!online) return;

      const players = res.players.list;
      const playersString =
        `(${players.length})` + players.length > 1
          ? players.map((e) => e.substring(0, 5).toUpperCase()).join(", ")
          : players[0];

      client.user.setPresence({
        activities: [{ name: playersString, type: ActivityType.Watching }],
      });
    })
    .catch((e) => {
      return;
    });
};
