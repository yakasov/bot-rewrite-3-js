const fs = require("fs");

module.exports = {
  aliases: ["commands"],
  description: "Shows a list of all available commands",
  run: async ([, msg]) => {
    var output = "```";
    var keyPairs = {};

    const cmdFiles = fs.readdirSync("./commands");
    cmdFiles.forEach((file) => {
      const cmd = require(`./${file}`);
      keyPairs[file.slice(0, -3)] = {
        aliases: cmd.aliases,
        description: cmd.description,
      };
    });

    Object.entries(keyPairs).forEach(([k, v]) => {
      const info = `\n\n${k}
${v.aliases.length ? "- Aliases: " + v.aliases.join(" | ") + "\n" : ""} - ${
        v.description
      }`;
      output += info;
    });
    output += "```";
    msg.reply(output);
  },
};
