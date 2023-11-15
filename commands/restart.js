const { exec } = require("child_process");

module.exports = {
  aliases: [],
  description: "Restarts the node process (owner only)",
  run: async (client, msg, args) => {
    await client.application.fetch();
    if (msg.author === client.application.owner) {
      console.log("Restarting...\n\n");
      exec("node index.js", (err, stdout, stderr) => {
        console.log(stdout);
      });
      client.destroy();
    }
  },
};
