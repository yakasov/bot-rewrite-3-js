const fs = require("fs");

exports.run = async () => {
  const dateString = new Date().toISOString().replace(/:/g, "-");
  const backupDir = "./resources/backup";
  const backupFile = `${backupDir  }/stats-${dateString}.json`;

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir);
  }

  fs.copyFile("./resources/stats.json", backupFile, (err) => {
    if (err) {
      console.error("Error backing up file:", err);
      
    }
    // Console.log(`Backup created: ${backupFile}`);
  });
};
