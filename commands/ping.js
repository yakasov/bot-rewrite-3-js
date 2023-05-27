module.exports = {
  aliases: ["pong"],
  description: "Ping!",
  run: async (client, msg, args) => {
    msg.channel.send(`Pong! ${client.ws.ping}ms`);
  },
};
