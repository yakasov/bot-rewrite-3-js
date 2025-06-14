"use strict";

const { SlashCommandBuilder } = require("discord.js");
const moment = require("moment-timezone");
const birthdays = require("../resources/birthdays.json");
const globals = require("../util/globals");

function parseBirthday(date) {
  return moment(date, "DD/MM/YYYY");
}

function getNextBirthdays(currentDate, count = 5) {
  const year = currentDate.year();

  let orderedBirthdays = Object.entries(birthdays)
    .map(([, v]) => [
      `${v.date}/${year}`,
      v.name
    ]);
  orderedBirthdays = orderedBirthdays.concat(
    orderedBirthdays.map(([date, name]) => [date.replace(year, year + 1), name])
  );

  orderedBirthdays.sort(
    ([dateA], [dateB]) =>
      parseBirthday(dateA)
        .diff(currentDate, "days") -
      parseBirthday(dateB)
        .diff(currentDate, "days")
  );

  let future = 0;
  let output = "";
  for (const [date, name] of orderedBirthdays) {
    if (parseBirthday(date)
      .isAfter(currentDate, "day") && future < count) {
      output += `${parseBirthday(date)
        .format("MMMM Do")}: ${name}\n`;
      future++;
    }
    if (future >= count) {
      break;
    }
  }
  return output;
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nextbirthdays")
    .setDescription("See when the next five birthdays are."),
  execute(interaction) {
    const currentDate = globals.get("currentDate");
    let output = getNextBirthdays(currentDate, 5);

    const year = currentDate.year();
    if (birthdays[interaction.user.id]) {
      output += `\nYour birthday is set as ${parseBirthday(
        `${birthdays[interaction.user.id].date}/${year}`
      )
        .format("MMMM Do")}.`;
    } else {
      output += "\nYou do not have a birthday set!";
    }

    return interaction.reply(output);
  }
};
