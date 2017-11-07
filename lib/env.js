'use strict';

const {homedir} = require('os');
const {platform, execPath, env} = process;

module.exports = {
  homedir: homedir(),
  execPath,
  win32: platform === 'win32',
  appData: env.APPDATA
};
