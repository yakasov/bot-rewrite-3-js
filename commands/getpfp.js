const { EmbedBuilder } = require('discord.js');

exports.run = async(client, msg, args) => {
    if (args.length) {
        const member = msg.mentions.members.first() || await msg.guild.members.fetch(args[0])
        avatar = member.displayAvatarURL({ size: 1024, dynamic: true });
    } else {
        avatar = msg.author.displayAvatarURL({ size: 1024, dynamic: true });
    }

    const embed = new EmbedBuilder()
        .setImage(avatar)
        .setAuthor({name: msg.author.username})
    msg.channel.send({embeds: [embed]})
}