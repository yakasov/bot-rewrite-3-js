# bot-rewrite-3-js

Discord bot written in Node.js.

## Features
- sending Happy Birthday messages
- replacing Twitter/X links with better embedding versions
- contains a full ranking system for users to gauge their activity in the guild
- ability to talk to the ChatGPT API
- ability to query Minecraft servers
- improved Scryfall card searching functionality
- automatic Fortnite store querying
- additional basic bot features such as /say, /claim for roles, etc

## Running

To run on your own guild, create a `config.json` file in `resources` (based off the template available in this folder) and edit the values to your needs. 
For most features to work, you will need to fill in `mainGuildId`.

Once this is done, you can `npm i` to get all required packages, followed by deploying the bot to your server by running `node ./deploy-commands.js`.
Afterwards, you should be able to run the bot using `node .`.

An example script for running the bot may look like this:
```
git pull
npm i --legacy-peer-deps
node deploy-commands.js
node .
```

## Contributing

Please feel free to create pull requests for any minor annoyances. You can use this bot however you want. Thanks!
