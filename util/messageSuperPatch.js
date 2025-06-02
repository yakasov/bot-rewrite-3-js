"use strict";

const { Message } = require("discord.js");

/*
 * This exists to overwrite the Message.prototype methods
 * to handle errors and keeping running rather than just crashing out
 */
function messageSuperPatch() {
  const superReply = Message.prototype.reply;

  Message.prototype.reply = function (s) {
    try {
      return superReply.call(this, {
        content: s,
        failIfNotExists: false,
      });
    } catch (e) {
      return console.error(e.message);
    }
  };

  const superDelete = Message.prototype.delete;

  Message.prototype.delete = function () {
    try {
      return superDelete.call(this);
    } catch (e) {
      return console.error(e.message);
    }
  };
}

module.exports = { messageSuperPatch };
