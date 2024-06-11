"use strict";

const { SlashCommandBuilder } = require("discord.js");
const moment = require("moment-timezone");
const birthdays = require("../resources/birthdays.json");

module.exports = {
  data: new SlashCommandBuilder()
    .setName("nextbirthdays")
    .setDescription("See when the next three birthdays are."),
  execute(interaction) {
    const year = globalThis.currentDate.year();
    let orderedBirthdays = Object.entries(birthdays)
      .map(([, v]) => [
        `${v.date}/${year}`,
        v.name,
      ]);
    orderedBirthdays = orderedBirthdays.concat(
      orderedBirthdays.map(([date, name]) => [
        date.replace(year, year + 1),
        name,
      ])
    );
    let future = 0;
    let output = "";

    orderedBirthdays.forEach(([date, name]) => {
      if (
        module.exports.f(date)
          .isAfter(globalThis.currentDate, "day") &&
        future < 3
      ) {
        output += `${module.exports.f(date)
          .format("MMMM Do")}: ${name}\n`;
        future++;
      }
    });

    if (birthdays[interaction.user.id]) {
      output += `\nYour birthday is set as ${module.exports
        .f(`${birthdays[interaction.user.id].date}/${year}`)
        .format("MMMM Do")}.`;
    } else {
      output += "\nYou do not have a birthday set!";
    }

    return interaction.reply(output);
  },
  f: (date) => moment(date, "DD/MM/YYYY"),
};
