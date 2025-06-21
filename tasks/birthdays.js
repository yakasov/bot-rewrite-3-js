"use strict";

const moment = require("moment-timezone");
const birthdays = require("../resources/birthdays.json");
const {
  mainGuildId,
  bdayChannelId,
  bdayRoleId,
} = require("../resources/config.json");
const globals = require("../util/globals");

exports.run = async (client, force = false) => {
  const today = moment()
    .tz("Europe/London");

  if (!today.isSame(globals.get("currentDate"), "day") || force) {
    globals.set("currentDate", today);
    const firstRun = globals.get("firstRun");

    const guild = await client.guilds.fetch(mainGuildId);
    const bdayChannel = await guild.channels.fetch(bdayChannelId);

    // Get all members with birthday role
    const roleMembers = guild.roles.cache.find(
      (r) => r.id === bdayRoleId
    ).members;
    const guildMembers = guild.members.cache;

    // Check for members not in server anymore
    if (firstRun.birthdays) {
      const promises = [];

      for (const id of Object.keys(birthdays)) {
        if (!guildMembers.some((gm) => gm.id === id)) {
          promises.push(client.users.fetch(id)
            .then((user) => {
              console.warn(`${id} (${user?.tag || "unknown user"})`);
            }));
        }
      }

      if (promises.length) {
        console.log(`The following birthday IDs are not present in guild ${guild.id} (${guild.name}):`);
        await Promise.all(promises);
      }

      firstRun.birthdays = false;
    }

    // Remove role if not their birthday anymore
    roleMembers.forEach((m) => {
      if (birthdays[m.id] && birthdays[m.id].date !== today.format("DD/MM")) {
        m.roles.remove(bdayRoleId);
      }
    });

    // Wish happy birthdays
    guildMembers.forEach((m) => {
      if (
        birthdays[m.id] &&
        birthdays[m.id].date === today.tz("Europe/London")
          .format("DD/MM") &&
        !roleMembers.some((me) => me.user.id === m.id)
      ) {
        m.roles.add(bdayRoleId);
        bdayChannel.send(
          `Happy Birthday, ${birthdays[m.id].name}! (<@${m.id}>)`
        );
      }
    });
  }
};
