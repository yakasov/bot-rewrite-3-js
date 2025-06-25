"use strict";

const { statsConfig } = require("./resources/config.json");
const { createTables } = require("./util/stats/dbFunctions.js");
const globals = require("./util/globals.js");

async function setupDatabase() {
  if (!statsConfig.useDatabase) {
    console.log("Database mode is not enabled in config.json");
    return;
  }

  console.log("Setting up the database");
  try {
    const dbFunctions = require("./util/stats/dbFunctions.js");
    
    console.log("Initialising database connection");
    dbFunctions.initialiseDatabase();
    
    console.log("Creating tables");
    await createTables();
    
    console.log("Database setup completed and it worked");
    
    // Try and migrate existing stats.json data if it exists
    const fs = require("fs");
    if (fs.existsSync("./resources/stats.json")) {
      try {
        console.log("Migrating stats data");
        const existingStats = require("./resources/stats.json");
        globals.set("stats", existingStats);
        await dbFunctions.saveStatsToDatabase();
        console.log("Stats have been migrated");
      } catch (err) {
        console.error("Error migrating stats:", err);
      }
    }
        
    await dbFunctions.closeDatabase();
    
  } catch (err) {
    console.error("Database setup failed:", err);
    // Try to close database connection even if setup failed
    try {
      const dbFunctions = require("./util/stats/dbFunctions.js");
      await dbFunctions.closeDatabase();
    } catch (closeErr) {
      console.error("Error closing database:", closeErr);
    }
    throw err;
  }
}

if (require.main === module) {
  setupDatabase()
    .catch(console.error);
}