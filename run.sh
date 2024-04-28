git pull
cp commands/prestige.js commands/goonmax.js
sed -i 's/.setName("prestige")/.setName("goonmax")/g' commands/goonmax.js
node deploy-commands.js
npm i --legacy-peer-deps
node .
