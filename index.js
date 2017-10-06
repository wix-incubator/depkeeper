'use strict';

const semver = require('semver');
const deps = require('./lib/deps');
const createRegistry = require('./lib/registry');
const findMinimal = require('./lib/find-minimal');


function depkeeper({cwd = process.cwd(), registryUrl = 'https://registry.npmjs.org/'} = {}) {
  const registry = createRegistry(registryUrl);

  function check(rules) {
    return deps.collect(cwd)
      .then(appendVersions)
      .then(list => appendMinimal(list, rules))
      .then(list => filterOutdated(list, !!rules))
      .then(filterOutNoise);
  }

  function appendVersions(list) {
    return Promise.all(list.map(withVersions));
  }

  function appendMinimal(list, rules = {}) {
    return list.map(dep =>
      Object.assign({}, dep, {minimal: findMinimal(dep.version, dep.versions, rules)}));
  }

  function filterOutdated(list, rules) {
    return list.filter(({version, minimal, latest}) => {
      return !version || !latest || rules ? minimal && semver.compare(version, minimal) === -1 : semver.neq(version, latest);
    });
  }

  function filterOutNoise(list) {
    const whiteList = ['name', 'version', 'minimal', 'latest'];
    return list.map(dep =>
      whiteList.reduce((result, prop) => {
        if (prop in dep && dep[prop]) {
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
