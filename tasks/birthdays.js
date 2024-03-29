const birthdays = require("./../resources/birthdays.json");
const {
  mainGuildId,
  bdayChannelId,
  bdayRoleId,
} = require("./../resources/config.json");

exports.run = async (client, date, force = false) => {
  const today = new Date().toLocaleDateString("en-GB").slice(0, -5);

  if (today > date || force) {
    date = today;

    const guild = await client.guilds.fetch(mainGuildId);
    const bdayChannel = await guild.channels.fetch(bdayChannelId);

    // get all members with birthday role
    const roleMembers = guild.roles.cache.find((r) => {
      return r.id === bdayRoleId;
    }).members;
    const guildMembers = guild.members.cache;

    // check for members not in server anymore
    Object.keys(birthdays).forEach((id) => {
      if (!guildMembers.some((gm) => gm.id == id)) {
        console.log(`${id} is not present in the server!`);
      }
    });

    // remove role if not their birthday anymore
    roleMembers.forEach((m) => {
      if (birthdays[m.id] && birthdays[m.id].date !== today) {
        m.roles.remove(bdayRoleId);
      }
    });

    // wish happy birthdays
    guildMembers.forEach((m) => {
      if (
        birthdays[m.id] &&
        birthdays[m.id].date === today &&
        !roleMembers.some((me) => me.user.id == m.id)
      ) {
        m.roles.add(bdayRoleId);
        bdayChannel.send(
          `Happy Birthday, ${birthdays[m.id].name}! (<@${m.id}>)`
        );
      }
    });
  }

  return date;
};
