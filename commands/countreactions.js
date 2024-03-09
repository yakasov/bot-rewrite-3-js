module.exports = {
  aliases: [],
  description: "Test",
  run: async ([client, msg]) => {
    await client.application.fetch();
    if (msg.author === client.application.owner) {
      module.exports
        .countAllReactions(msg.guild)
        .then(() => {
          console.log(
            `Finished processing: ${JSON.stringify(
              module.exports.reactionsDict
            )}`
          );
        })
        .catch(console.error);
    }
  },

  countReactions: async (channel, before = null) => {
    const options = { limit: 50 };
    if (before) options.before = before;

    try {
      const messages = await channel.messages.fetch(options);
      if (!messages.size) return 0;

      messages.each((message) => {
        message.reactions.cache.each((reaction) => {
          if (reaction.emoji.name == "🤓")
            module.exports.reactionsDict[message.author.username] =
              (module.exports.reactionsDict[message.author.username] || 0) +
              message.reactions.cache.get("🤓").count;
          // You can probably just do reaction.count here
          // but I wasn't sure if that would count *all* reactions on the message accidentally
        });
      });

      const lastMessage = messages.last();
      console.log(
        `${new Date().toJSON()} > ${JSON.stringify(
          module.exports.reactionsDict
        )}`
      );

      return await module.exports.countReactions(channel, lastMessage.id);
    } catch (e) {
      console.log(`${channel.name} > ${e.message}`);
      // usually this happens because of No Access 50001, meaning
      // it can't access that channel
    }
  },

  countAllReactions: async (guild) => {
    const channels = guild.channels.cache.filter(
      (channel) => channel.type == 0 // text channel
    );

    for (const channel of channels.values()) {
      await module.exports.countReactions(channel);
    }
  },

  reactionsDict: {},
};
