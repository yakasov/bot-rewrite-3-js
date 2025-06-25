/* eslint-disable init-declarations */
"use strict";

const mariadb = require("mariadb");
const { database } = require("../../resources/config.json");
const globals = require("../globals.js");

let pool = null;

function initialiseDatabase() {
  if (pool) {
    return;
  }

  try {
    pool = mariadb.createPool({
      host: database.host,
      port: database.port,
      user: database.user,
      password: database.password,
      database: database.database,
      connectionLimit: 5,
      acquireTimeout: 10000,
      timeout: 10000
    });

    console.log("Database pool created successfully");
  } catch (err) {
    console.error("Failed to create database pool:", err);
    throw err;
  }
}

async function createTables() {
  if (!pool) {
    initialiseDatabase();
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Create guilds table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS guilds (
        guild_id VARCHAR(20) PRIMARY KEY,
        allow_responses BOOLEAN DEFAULT TRUE,
        rank_up_channel VARCHAR(20) DEFAULT ''
      )
    `);

    // Create user_stats table
    await conn.query(`
      CREATE TABLE IF NOT EXISTS user_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        guild_id VARCHAR(20) NOT NULL,
        user_id VARCHAR(20) NOT NULL,
        messages INT DEFAULT 0,
        voice_time INT DEFAULT 0,
        join_time INT DEFAULT 0,
        last_gain_time INT DEFAULT 0,
        total_experience INT DEFAULT 0,
        level_experience INT DEFAULT 0,
        level_value INT DEFAULT 0,
        score INT DEFAULT 0,
        custom_set_name BOOLEAN DEFAULT FALSE,
        name VARCHAR(255) DEFAULT '',
        previous_messages INT DEFAULT 0,
        previous_voice_time INT DEFAULT 0,
        achievements TEXT DEFAULT '[]',
        achievement_tracking TEXT DEFAULT '{}',
        unlocked_names TEXT DEFAULT '[]',
        UNIQUE KEY unique_guild_user (guild_id, user_id),
        FOREIGN KEY (guild_id) REFERENCES guilds(guild_id) ON DELETE CASCADE
      )
    `);

    console.log("Database tables created/verified successfully");
  } catch (err) {
    console.error("Error creating database tables:", err);
    throw err;
  } finally {
    if (conn) {conn.release();}
  }
}

async function loadStatsFromDatabase() {
  if (!pool) {
    initialiseDatabase();
  }

  let conn;
  try {
    conn = await pool.getConnection();

    // Load guilds
    const guilds = await conn.query("SELECT * FROM guilds");
    const stats = {};

    for (const guild of guilds) {
      stats[guild.guild_id] = {
        allowResponses: guild.allow_responses,
        rankUpChannel: guild.rank_up_channel
      };
    }

    // Load user stats
    const userStats = await conn.query("SELECT * FROM user_stats");
    
    for (const userStat of userStats) {
      if (!stats[userStat.guild_id]) {
        stats[userStat.guild_id] = {
          allowResponses: true,
          rankUpChannel: ""
        };
      }

      stats[userStat.guild_id][userStat.user_id] = {
        messages: userStat.messages,
        voiceTime: userStat.voice_time,
        joinTime: userStat.join_time,
        lastGainTime: userStat.last_gain_time,
        totalExperience: userStat.total_experience,
        levelExperience: userStat.level_experience,
        level: userStat.level_value,
        score: userStat.score,
        customSetName: userStat.custom_set_name,
        name: userStat.name || "",
        previousMessages: userStat.previous_messages,
        previousVoiceTime: userStat.previous_voice_time,
        achievements: userStat.achievements && userStat.achievements !== "" ? JSON.parse(userStat.achievements) : [],
        achievementTracking: userStat.achievement_tracking && userStat.achievement_tracking !== "" ? JSON.parse(userStat.achievement_tracking) : {},
        unlockedNames: userStat.unlocked_names && userStat.unlocked_names !== "" ? JSON.parse(userStat.unlocked_names) : [],
      };
    }

    return stats;
  } catch (err) {
    console.error("Error loading stats from database:", err);
    throw err;
  } finally {
    if (conn) {conn.release();}
  }
}

async function saveStatsToDatabase() {
  if (!pool) {
    initialiseDatabase();
  }

  const stats = globals.get("stats");
  if (!stats) {
    return;
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.beginTransaction();

    for (const [guildId, guildData] of Object.entries(stats)) {
      // Insert/update guild
      await conn.query(
        `INSERT INTO guilds (guild_id, allow_responses, rank_up_channel) 
         VALUES (?, ?, ?) 
         ON DUPLICATE KEY UPDATE 
         allow_responses = VALUES(allow_responses), 
         rank_up_channel = VALUES(rank_up_channel)`,
        [guildId, guildData.allowResponses, guildData.rankUpChannel || ""]
      );

      // Insert/update user stats
      for (const [userId, userData] of Object.entries(guildData)) {
        if (userId === "allowResponses" || userId === "rankUpChannel") {
          // eslint-disable-next-line no-continue
          continue;
        }

        await conn.query(
          `INSERT INTO user_stats 
           (guild_id, user_id, messages, voice_time, join_time, last_gain_time, total_experience, level_experience, level_value, score, custom_set_name, name, previous_messages, previous_voice_time, achievements, achievement_tracking, unlocked_names) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) 
           ON DUPLICATE KEY UPDATE 
           messages = VALUES(messages),
           voice_time = VALUES(voice_time),
           join_time = VALUES(join_time),
           last_gain_time = VALUES(last_gain_time),
           total_experience = VALUES(total_experience),
           level_experience = VALUES(level_experience),
           level_value = VALUES(level_value),
           score = VALUES(score),
           custom_set_name = VALUES(custom_set_name),
           name = VALUES(name),
           previous_messages = VALUES(previous_messages),
           previous_voice_time = VALUES(previous_voice_time),
           achievements = VALUES(achievements),
           achievement_tracking = VALUES(achievement_tracking),
           unlocked_names = VALUES(unlocked_names)`,
          [
            guildId,
            userId,
            userData.messages || 0,
            userData.voiceTime || 0,
            userData.joinTime || 0,
            userData.lastGainTime || 0,
            userData.totalExperience || 0,
            userData.levelExperience || 0,
            userData.level || 0,
            userData.score || 0,
            userData.customSetName || false,
            userData.name || "",
            userData.previousMessages || 0,
            userData.previousVoiceTime || 0,
            JSON.stringify(userData.achievements || []),
            JSON.stringify(userData.achievementTracking || {}),
            JSON.stringify(userData.unlockedNames || []),
          ]
        );
      }
    }

    await conn.commit();
  } catch (err) {
    if (conn) {await conn.rollback();}
    console.error("Error saving stats to database:", err);
    throw err;
  } finally {
    if (conn) {conn.release();}
  }
}

async function backupStatsFromDatabase() {
  // For database storage, we can create a backup by exporting to JSON
  try {
    const stats = await loadStatsFromDatabase();
    const fs = require("fs");
    const moment = require("moment-timezone");
    
    const backupDir = "./logs/backups/";
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const backupFile = `${backupDir}stats_backup_${moment()
      .format("YYYY-MM-DD_HH-mm-ss")}.json`;
    fs.writeFileSync(backupFile, JSON.stringify(stats, null, 2));
    
    console.log(`Database stats backed up to ${backupFile}`);
  } catch (err) {
    console.error("Error backing up database stats:", err);
  }
}

// Scary function!!
async function resetDatabase(guildId) {
  if (!pool) {
    initialiseDatabase();
  }

  let conn;
  try {
    conn = await pool.getConnection();
    await conn.query("DELETE FROM user_stats WHERE guild_id = ?", [guildId]);
  } catch (err) {
    console.error("Error resetting database:", err);
    throw err;
  } finally {
    if (conn) {conn.release();}
  }
}

async function closeDatabase() {
  if (pool && !pool.closed) {
    await pool.end();
    // eslint-disable-next-line require-atomic-updates
    pool = null;
  }
}

module.exports = {
  initialiseDatabase,
  createTables,
  loadStatsFromDatabase,
  saveStatsToDatabase,
  backupStatsFromDatabase,
  closeDatabase,
  resetDatabase
}; 