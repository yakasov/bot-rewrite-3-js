module.exports = {
  aliases: [],
  description: "Repeats any input given",
  run: async ([, msg, args]) => {
    msg.delete();
    return msg.channel.send(`${args.join(" ")}`);
  },
};
