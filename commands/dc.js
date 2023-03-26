const { getVoiceConnection } = require('@discordjs/voice')

exports.run = async(client, msg, args) => {
    const conn = getVoiceConnection(msg.guild.id);
    if (conn) {
        conn.destroy();
    }
}