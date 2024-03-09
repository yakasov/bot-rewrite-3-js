const { exec } = require("child_process");

module.exports = {
  aliases: [],
  description: "Restarts the node process (owner only)",
  run: async ([client, msg]) => {
    await client.application.fetch();
    if (msg.author === client.application.owner) {
      console.log("Restarting...\n\n");
      exec("node index.js", ([, stdout]) => {
        console.log(stdout);
      });
      client.destroy();
    }
  },
};
