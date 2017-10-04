'use strict';

const semver = require('semver');
const deps = require('./lib/deps');
const createRegistry = require('./lib/registry');

function depkeeper({cwd = process.cwd(), registryUrl = 'https://registry.npmjs.org/'} = {}) {
  const registry = createRegistry(registryUrl);

  function check() {
    return deps.collect(cwd)
      .then(appendVersions)
      .then(filterOutdated)
      .then(filterNoise);
  }

  function appendVersions(list) {
    return Promise.all(list.map(withVersions));
  }

  function filterOutdated(list) {
    return list.filter(({version, latest}) =>
      !version || !latest || semver.neq(version, latest));
  }

  function filterNoise(list) {
    const whiteList = ['name', 'version', 'minimal', 'latest'];
    return list.map(dep =>
      whiteList.reduce((result, prop) => {
        if (prop in dep) {
          result[prop] = dep[prop];
        }
        return result;
      }, {}));
  }

  function withVersions(dep) {
    return registry.getVersions(dep.name)
      .then(versions => Object.assign({}, dep, versions));
  }

  return {check};
}

module.exports = depkeeper;
