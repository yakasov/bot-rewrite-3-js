"use strict";

const { initialSetup } = require("./util/setup.js");
initialSetup();

const { Client, Events, GatewayIntentBits } = require("discord.js");
const fetch = require("node-fetch");
const moment = require("moment-timezone");
const process = require("node:process");

const chanceResponses = require("./resources/chanceResponses.json");
const loadedStats = require("./resources/stats.json");
const { token } = require("./resources/config.json");

const { generateRollTable } = require("./util/rollTableGenerator.js");
const globals = require("./util/globals.js");
const { loadCommands } = require("./util/commandLoader.js");
const { messageSuperPatch } = require("./util/messageSuperPatch.js");

const { handleClientReady } = require("./events/ready.js");
const { handleInteractionCreate } = require("./events/interactionCreate.js");
const { handleMessageCreate } = require("./events/messageCreate.js");
const { handleVoiceStateUpdate } = require("./events/voiceStateUpdate.js");

process.on("unhandledRejection", (error) => {
  console.error("Unhandled error:", error);
});

globals.set("botUptime", 0);
globals.set("currentDate", moment()
  .tz("Europe/London"));
globals.set("firstRun", { birthdays: true, minecraft: 1 });
globals.set("rollTable", generateRollTable(chanceResponses));
globals.set("splash", "");
globals.set("stats", loadedStats);
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

process.on("unhandledRejection", (error) => {
  console.error("Unhandled error:", error);
});

messageSuperPatch();
loadCommands(globalThis.client);

globalThis.client.once(Events.ClientReady, handleClientReady);
globalThis.client.on(Events.InteractionCreate, handleInteractionCreate);
globalThis.client.on(Events.MessageCreate, handleMessageCreate);
globalThis.client.on(Events.VoiceStateUpdate, handleVoiceStateUpdate);

globalThis.client.login(token);
