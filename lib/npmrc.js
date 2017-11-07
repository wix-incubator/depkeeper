'use strict';

const path = require('path');
const ini = require('ini');
const {readFile} = require('./fs');
const env = require('./env');

function npmrc(cwd, {homedir, execPath, appData, win32} = env) {

  // The four relevant files are:
  // per-project configuration file (/path/to/my/project/.npmrc)
  // per-user configuration file (defaults to $HOME/.npmrc; configurable via CLI option --userconfig or environment variable $NPM_CONFIG_USERCONFIG)
  // global configuration file (defaults to $PREFIX/etc/npmrc; configurable via CLI option --globalconfig or environment variable $NPM_CONFIG_GLOBALCONFIG)
  // npm's built-in configuration file (/path/to/npm/npmrc)
  const rcs = [
    {loc: path.join(cwd, '.npmrc')},
    {loc: path.join(homedir, '.npmrc')},
    {loc: path.join('etc', 'npmrc'), prefix: getPrefix},
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

  function getRcConfig({loc, config, prefix = empty}) {
    if (config) {
      return Promise.resolve(config);
    }

    return prefix()
      .then(pre => path.join(pre, loc))
      .then(readFile)
      .then(content => ini.parse(content))
      .catch(() => null);
  }

  function getPrefix() {
    const noCircular = rcs.filter((rc, i) => i !== 2);
    return try2Find('prefix', noCircular)
      .then(prefix => prefix || (win32 ?
        path.join(appData, 'npm') :
        path.join(execPath, '..', '..', 'npm')));
  }

  function getNpmLocation() {
    return win32 ?
      path.join(execPath, '..', 'node_modules', 'npm') :
      path.join(execPath, '..', '..', 'lib', 'node_modules', 'npm');
  }

  function empty() {
    return Promise.resolve('');
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
