module.exports = {
  aliases: [],
  description: "Repeats any input given",
  run: async ([, msg, args]) => {
    try {
      msg.delete();
    } catch (e) {
      msg.channel.send(e.message);
    }
    return msg.channel.send(`${args.join(" ")}`);
  },
};
