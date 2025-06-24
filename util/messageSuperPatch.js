"use strict";

const { Message } = require("discord.js");

/*
 * This exists to overwrite the Message.prototype methods
 * to handle errors and to keep the bot running rather 
 * than just crashing out
 */
function messageSuperPatch() {
  const superReply = Message.prototype.reply;

  Message.prototype.reply = function (string) {
    try {
      return superReply.call(this, {
        content: string,
        failIfNotExists: false
      });
    } catch (err) {
      return console.error(err.message);
    }
  };

  const superDelete = Message.prototype.delete;

  Message.prototype.delete = function () {
    try {
      return superDelete.call(this);
    } catch (err) {
      return console.error(err.message);
    }
  };
}

module.exports = { messageSuperPatch };
