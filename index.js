const { Client, Events, GatewayIntentBits } = require('discord.js');
const { token, prefix } = require('./resources/config.json');

const client = new Client({
	intents: [
		GatewayIntentBits.Guilds,
		GatewayIntentBits.GuildMembers,
		GatewayIntentBits.GuildMessages,
		GatewayIntentBits.GuildMessageReactions,
		GatewayIntentBits.GuildPresences,
		GatewayIntentBits.GuildVoiceStates,
		GatewayIntentBits.MessageContent,
	],
});
const date = new Date()

client.once(Events.ClientReady, c => {
	console.log(
		'Connected and ready to go!\n' +
		`Current date is ${date.toLocaleDateString('en-GB')}, ` +
		`logged in as ${c.user.tag}`
	);
});

client.on('messageCreate', async (msg) => {
    if(msg.author.bot) return;
    if(!msg.guild) return;

    if(!msg.content.toLowerCase().startsWith(prefix)) return;

    var args = msg.content.split(' ');
    var cmd = args.shift().slice(prefix.length).toLowerCase();

    try {
        var file = require(`./commands/${cmd}.js`);
        file.run(client, msg, args);
    } catch(err) {
        console.warn(err);
    }
});

client.login(token);
