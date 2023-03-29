const { exec } = require('child_process');

exports.run = async (client, msg, args) => {
    exec("node index.js", (err, stdout, stderr) => {
        console.log(stdout)
    });
    client.destroy();    
}