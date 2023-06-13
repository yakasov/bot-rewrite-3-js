const { ActivityType } = require("discord.js");
const { queryFull } = require("minecraft-server-util");
const {
  minecraftServerIp,
  minecraftServerPort,
} = require("./../resources/config.json");

exports.run = async (client) => {
  if (!(minecraftServerIp && minecraftServerPort)) {
    return;
  }

  var result;

  queryFull(minecraftServerIp, minecraftServerPort)
    .then(async (res) => {
      const online = res.players.online;
      const players = res.players.list;

      client.user.setPresence({
        activities: [
          { name: `MC Online: ${online}`, type: ActivityType.Watching },
        ],
      });

      if (online) {
        await new Promise((r) => setTimeout(r, 5000));
        client.user.setPresence({
          activities: [
            {
              name: `MC Players: ${players.join(" | ")}`,
              type: ActivityType.Watching,
            },
          ],
        });
      }

      result = true;
    })
    .catch((e) => {
      console.error(`\n${e}`);
      result = false;
    });

  return result;
};
