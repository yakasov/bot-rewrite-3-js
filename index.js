"use strict";

const process = require("node:process");
const { Client, Events, GatewayIntentBits } = require("discord.js");
const moment = require("moment-timezone");
const fetch = require("node-fetch");

const { token } = require("./resources/config.json");
const chanceResponses = require("./resources/chanceResponses.json");
const loadedStats = require("./resources/stats.json");
const { initialSetup } = require("./util/setup.js");

const { generateRollTable } = require("./util/rollTableGenerator.js");
const loadCommands = require("./util/commandLoader.js");
const messageSuperPatch = require("./util/messageSuperPatch.js");

const handleClientReady = require("./events/ready.js");
const handleMessageCreate = require("./events/messageCreate.js");
const handleInteractionCreate = require("./events/interactionCreate.js");
const handleVoiceStateUpdate = require("./events/voiceStateUpdate.js");

process.on("unhandledRejection", (error) => {
  console.error("Unhandled error:", error);
});

globalThis.fetch = fetch;
globalThis.stats = loadedStats;
globalThis.rollTable = generateRollTable(chanceResponses);
globalThis.currentDate = moment()
  .tz("Europe/London");
globalThis.firstRun = { birthdays: true, minecraft: 1 };
globalThis.botUptime = 0;
globalThis.splash = "";

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

initialSetup();
messageSuperPatch();
loadCommands(globalThis.client);

globalThis.client.login(token);

globalThis.client.once(Events.ClientReady, handleClientReady);
globalThis.client.on(Events.MessageCreate, handleMessageCreate);
globalThis.client.on(Events.InteractionCreate, handleInteractionCreate);
globalThis.client.on(Events.VoiceStateUpdate, handleVoiceStateUpdate);

globalThis.client.login(token);
