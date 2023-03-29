const { exec } = require('child_process');

exports.run = async (client, msg, args) => {
  await client.application.fetch();
  if (msg.author === client.application.owner) {
    exec("node index.js", (err, stdout, stderr) => {
      console.log(stdout)
    });
    client.destroy();    
  }
}