const birthdays = require('./../resources/birthdays.json')
const { mainGuildId, bdayChannelId, bdayRoleId } = require('./../resources/config.json');

exports.run = async(client, date, force = false) => {
    const today = new Date().toLocaleDateString('en-GB').slice(0, -5)

    if (today > date || force) {
        date = today;

        const guild = await client.guilds.fetch(mainGuildId)
        const bdayChannel = await guild.channels.fetch(bdayChannelId)

        const roleMembers = guild.roles.cache.find((r) => {
            return r.id === bdayRoleId
        }).members
        const guildMembers = guild.members.cache;

        roleMembers.forEach((m) => {
            if (birthdays[m.id] && birthdays[m.id].date !== today) {
                m.roles.remove(bdayRoleId)
            }
        })
        guildMembers.forEach((m) => {
            if (birthdays[m.id] && birthdays[m.id].date === today) {
                m.roles.add(bdayRoleId)
                bdayChannel.send(`Happy Birthday, ${birthdays[m.id].name}! (<@${m.id}>)`)
            }
        })
    }

    return date;
}