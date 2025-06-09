"use strict";

const state = {
  botUptime: 0,
  currentDate: null,
  firstRun: null,
  rollTable: null,
  splash: "",
  stats: null,
};

module.exports = {
  get(key) {
    return state[key];
  },
  set(key, value) {
    state[key] = value;
  },
};
