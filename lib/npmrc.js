'use strict';

const path = require('path');
const osHomedir = require('os-homedir');
const ini = require('ini');
const {readFile} = require('./fs');

function npmrc(cwd) {

  // The four relevant files are:
  // per-project configuration file (/path/to/my/project/.npmrc)
  // per-user configuration file (defaults to $HOME/.npmrc; configurable via CLI option --userconfig or environment variable $NPM_CONFIG_USERCONFIG)
  // global configuration file (defaults to $PREFIX/etc/npmrc; configurable via CLI option --globalconfig or environment variable $NPM_CONFIG_GLOBALCONFIG)
  // npm's built-in configuration file (/path/to/npm/npmrc)
  const rcs = [
    {loc: path.join(cwd, '.npmrc')},
    {loc: path.join(osHomedir(), '.npmrc')},
    {loc: path.join(getPrefix(), 'etc', 'npmrc')},
    {loc: path.join(getNpmLocation(), 'npmrc')}
  ];

  function get(name) {
    return try2Find(name, rcs.slice());
  }

  function try2Find(name, list) {
    const rc = list.shift();
    return !rc ? Promise.resolve() : getRcConfig(rc)
      .then(config => {
        rc.config = config;
        return (config && config[name]) || try2Find(name, list);
      });
  }

  function getRcConfig({loc, config}) {
    return config ?
      Promise.resolve(config) :
      readFile(loc)
        .then(content => ini.parse(content))
        .catch(() => null);
  }

  function getPrefix() {
    // FIXME: prefix can also be configured inside npmrc
    // on Windows it's inside builtin configuration

    return isWin() ?
      path.join(process.env.APPDATA, 'npm') :
      path.join(process.execPath, '..', '..', 'npm');
  }

  function getNpmLocation() {
    return isWin() ?
      path.join(process.execPath, '..', 'node_modules', 'npm') :
      path.join(process.execPath, '..', '..', 'lib', 'node_modules', 'npm');
  }

  function isWin() {
    return process.platform === 'win32';
  }

  /*
  function getPrefix() {
    // ORIGIN: https://github.com/npm/npm/blob/latest/lib/config/defaults.js#L88-L105

    let prefix;

    if (process.env.PREFIX) {
      prefix = process.env.PREFIX;
    } else if (process.platform === 'win32') {
      // c:\node\node.exe --> prefix=c:\node\
      prefix = path.dirname(process.execPath);
    } else {
      // /usr/local/bin/node --> prefix=/usr/local
      prefix = path.dirname(path.dirname(process.execPath));

      // destdir only is respected on Unix
      if (process.env.DESTDIR) {
        prefix = path.join(process.env.DESTDIR, prefix);
      }
    }

    return prefix;
  }
  */

  return {get};
}

module.exports = npmrc;
