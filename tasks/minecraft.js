const { ActivityType } = require("discord.js");
const { queryFull } = require("minecraft-server-util");
const {
  minecraftServerIp,
  minecraftServerPort,
} = require("./../resources/config.json");

exports.run = async (client, minecraftResult) => {
  if (!(minecraftServerIp && minecraftServerPort)) {
    return;
  }

  queryFull(minecraftServerIp, minecraftServerPort)
    .then(async (res) => {
      const online = res.players.online;
      const players = res.players.list;
      const activity = online && minecraftResult === -1 ? `MC Players: ${players.join(" | ")}` : `MC Online: ${online}`;

      client.user.setPresence({
        activities: [
          { name: activity, type: ActivityType.Watching },
        ],
      });
    })
    .catch((e) => {
      console.error(`\n${e}`);
      return 0;
    });

  return  minecraftResult * -1;
};
