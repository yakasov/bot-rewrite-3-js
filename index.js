"use strict";

const { Client, Events, GatewayIntentBits } = require("discord.js");
const fetch = require("node-fetch");
const moment = require("moment-timezone");
const process = require("node:process");

const chanceResponses = require("./resources/chanceResponses.json");
const { token } = require("./resources/config.json");

const { generateRollTable } = require("./util/rollTableGenerator.js");
const globals = require("./util/globals.js");
const { loadCommands } = require("./util/commandLoader.js");
const { messageSuperPatch } = require("./util/messageSuperPatch.js");
const { loadStats } = require("./util/stats/persistence.js");

const { handleClientReady } = require("./events/ready.js");
const { handleInteractionCreate } = require("./events/interactionCreate.js");
const { handleMessageCreate } = require("./events/messageCreate.js");
const { handleVoiceStateUpdate } = require("./events/voiceStateUpdate.js");

process.on("unhandledRejection", (error) => {
  console.error("Unhandled error:", error);
});

async function initBot() {
  globals.set("botUptime", 0);
  globals.set("currentDate", moment()
    .tz("Europe/London"));
  globals.set("firstRun", { birthdays: true, minecraft: 1 });
  globals.set("rollTable", generateRollTable(chanceResponses));
  globals.set("splash", "");

  try {
    const loadedStats = await loadStats();
    globals.set("stats", loadedStats);
    console.log("Stats loaded successfully");
  } catch (err) {
    console.error("Failed to load stats:", err);
    globals.set("stats", {});
  }

  globalThis.fetch = fetch;

  globalThis.client = new Client({
    allowedMentions: {
      parse: ["users", "roles"],
      repliedUser: true,
    },
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.GuildMessageReactions,
      GatewayIntentBits.GuildPresences,
      GatewayIntentBits.GuildVoiceStates,
      GatewayIntentBits.MessageContent,
    ],
  });

  messageSuperPatch();
  loadCommands(globalThis.client);

  globalThis.client.once(Events.ClientReady, handleClientReady);
  globalThis.client.on(Events.InteractionCreate, handleInteractionCreate);
  globalThis.client.on(Events.MessageCreate, handleMessageCreate);
  globalThis.client.on(Events.VoiceStateUpdate, handleVoiceStateUpdate);

  globalThis.client.login(token);
}


// Needed for async function at top of file
initBot()
  .catch((err) => {
    console.error("Failed to initialise bot:", err);
    process.exit(1);
  });
