'use strict';

const path = require('path');
const fetch = require('node-fetch');
const semver = require('semver');
const osHomedir = require('os-homedir');
const ini = require('ini');
const fs = require('./fs');

const npmRegistry = 'https://registry.npmjs.org';

function registry(cwd, url) {
  let registryUrl = url;
  const depsCache = {};

  function getVersions(name) {
    return getRegistryUrl()
      .then(regUrl => getMeta(regUrl, name));
  }

  function getRegistryUrl() {
    if (registryUrl) {
      return Promise.resolve(registryUrl);
    }
    return loadNpmrc()
      .then(npmrc => (registryUrl = ini.parse(npmrc).registry))
      .catch(() => (registryUrl = npmRegistry));
  }

  function getMeta(regUrl, name) {
    let result;

    if (depsCache[name]) {
      return depsCache[name];
    }

    return fetch(regUrl.replace(/\/$/, '') + '/' + name)
      .then(resp => {
        const {status, statusText, ok} = resp;
        result = {status, statusText, ok};
        return resp.json();
      })
      .then(meta => (depsCache[name] = Object.assign(result, {
        latest: getLatest(meta),
        versions: extractVersions(meta.versions)
      })))
      .catch(() => Object.assign(result, {versions: []}));
  }

  function loadNpmrc() {
    // The four relevant files are:
    // per-project configuration file (/path/to/my/project/.npmrc)
    // per-user configuration file (defaults to $HOME/.npmrc; configurable via CLI option --userconfig or environment variable $NPM_CONFIG_USERCONFIG)
    // global configuration file (defaults to $PREFIX/etc/npmrc; configurable via CLI option --globalconfig or environment variable $NPM_CONFIG_GLOBALCONFIG)
    // npm's built-in configuration file (/path/to/npm/npmrc)

    return lookForNpmrc([
      path.join(cwd, '.npmrc'),
      path.join(osHomedir(), '.npmrc'),
      path.join(getPrefix(), 'etc', 'npmrc'),
      path.join(process.env.npm_execpath, '..', '..', 'npmrc')
    ]);
  }

  function getLatest(meta) {
    return (meta['dist-tags'] || {}).latest;
  }

  function extractVersions(versions) {
    return Object.keys(versions)
      .filter(ver => !semver.prerelease(ver)) // TODO: should pre-released versions be filtered out?
      .sort(semver.compare);
  }

  function lookForNpmrc(paths) {
    const list = paths.slice();
    const npmrcPath = list.shift();
    return npmrcPath ? fs.readFile(npmrcPath).catch(() => lookForNpmrc(list)) : Promise.reject();
  }

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

  return {getRegistryUrl, getVersions};
}


module.exports = registry;
