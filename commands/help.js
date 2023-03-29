const fs = require("fs");

module.exports = {
  aliases: ["commands"],
  description: "Shows a list of all available commands",
  run: async (client, msg, args) => {
    var output = "```";
    var keyPairs = {};

    const cmdFiles = fs.readdirSync("./commands");
    cmdFiles.forEach((file) => {
      const cmd = require(`./${file}`);
      keyPairs[file.slice(0, -3)] = {
        "aliases": cmd.aliases,
        "description": cmd.description
      }
    })

    Object.entries(keyPairs).forEach(([k, v]) => {
      const info = `\n\n${k}
- Aliases: ${v.aliases.length ? v.aliases.join(" | ") : "none"}
- ${v.description}`;
      output += info;
    })
    output += "```";
    msg.reply(output);
  }
};
