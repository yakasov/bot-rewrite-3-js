module.exports = {
  aliases: [],
  description: "Repeats any input given",
  run: async (client, msg, args) => {
    msg.delete();
    msg.channel.send(`${args.join(" ")}`);
  },
};
