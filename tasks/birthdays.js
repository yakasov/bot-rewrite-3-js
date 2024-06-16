"use strict";

const moment = require("moment-timezone");
const birthdays = require("../resources/birthdays.json");
const {
  mainGuildId,
  bdayChannelId,
  bdayRoleId
} = require("../resources/config.json");

exports.run = async (client, force = false) => {
  const today = moment()
    .tz("Europe/London");

  if (!today.isSame(globalThis.currentDate, "day") || force) {
    globalThis.currentDate = moment();
    const guild = await client.guilds.fetch(mainGuildId);
    const bdayChannel = await guild.channels.fetch(bdayChannelId);

    // Get all members with birthday role
    const roleMembers = guild.roles.cache.find(
      (r) => r.id === bdayRoleId
    ).members;
    const guildMembers = guild.members.cache;

    // Check for members not in server anymore
    if (globalThis.firstRun.birthdays) {
      Object.keys(birthdays)
        .forEach((id) => {
          if (!guildMembers.some((gm) => gm.id === id)) {
            console.log(`${id} is not present in the server!`);
          }
        });

      globalThis.firstRun.birthdays = false;
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
