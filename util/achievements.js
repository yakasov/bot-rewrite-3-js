"use strict";

const actualAchievements = require("../resources/achievements.json");

exports.run = (msg) => {
  const guildId = msg.guild.id;
  const userId = msg.author.id;
  const { content } = msg;

  const stats = globalThis.stats[guildId][userId];
  const { achievements } = stats;
  const { achievementTracking } = stats;
  const { unlockedNames } = stats;

  if (!achievements.includes("jork") && content.includes("jork")) {
    achievements.push("jork");
    achievementTracking.jork = 0;
    unlockedNames.push(actualAchievements.jork.unlock);
  }

  if (!achievements.includes("jorkPro") && content.includes("jork")) {
    achievementTracking.jork++;

    if (achievementTracking.jork === 25) {
      achievements.push("jorkPro");
      unlockedNames.push(actualAchievements.jorkPro.unlock);
    }
  }

  if (!achievements.includes("level25") && stats.level >= 25) {
    achievements.push("level25");
  }

  if (!achievements.includes("level50") && stats.level >= 50) {
    achievements.push("level50");
    unlockedNames.push(actualAchievements.level50.unlock);
  }

  if (!achievements.includes("level100") && stats.level >= 100) {
    achievements.push("level100");
    unlockedNames.push(actualAchievements.level100.name);
  }

  if (!achievements.includes("level250") && stats.level >= 250) {
    achievements.push("level250");
    unlockedNames.push(actualAchievements.level250.name);
  }

  if (!achievements.includes("messages500") && stats.messages === 500) {
    achievements.push("messages500");
    unlockedNames.push(actualAchievements.messages500.name);
  }

  if (!achievements.includes("messages1000") && stats.messages === 1000) {
    achievements.push("messages1000");
  }

  if (!achievements.includes("messages2500") && stats.messages === 2500) {
    achievements.push("messages2500");
    unlockedNames.push(actualAchievements.messages2500.name);
  }

  if (
    !achievements.includes("mrbeast") &&
    ["beast", "breast", "mr beast"].some((s) => content.includes(s))
  ) {
    achievements.push("mrbeast");
  }

  if (!achievements.includes("voiceTime1hr") && stats.voiceTime >= 3600) {
    achievements.push("voiceTime1hr");
  }

  if (!achievements.includes("voiceTime8hrs") && stats.voiceTime >= 3600 * 8) {
    achievements.push("voiceTime8hrs");
    unlockedNames.push(actualAchievements.voiceTime8hrs.name);
  }

  if (
    !achievements.includes("voiceTime24hrs") &&
    stats.voiceTime >= 3600 * 24
  ) {
    achievements.push("voiceTime24hrs");
  }

  if (
    !achievements.includes("voiceTime100hrs") &&
    stats.voiceTime >= 3600 * 100
  ) {
    achievements.push("voiceTime100hrs");
  }
};
