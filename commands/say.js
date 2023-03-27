exports.run = async (client, msg, args) => {
  msg.delete();
  msg.channel.send(`${args.join(" ")}`);
};
