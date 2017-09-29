'use strict';

const semver = require('semver');
const deps = require('./lib/deps');
const createRegistry = require('./lib/registry');

function depkeeper({cwd = process.cwd(), registryUrl = 'https://registry.npmjs.org/'} = {}) {
  const registry = createRegistry(registryUrl);

  function check(/*rules*/) {
    return deps.collect(cwd)
      .then(appendLatest)
      .then(filterOutdated);
  }

  function appendLatest(list) {
    return Promise.all(list.map(withLatest));
  }

  function filterOutdated(list) {
    return list.filter(({version, latest}) =>
      !version || !latest || semver.neq(version, latest));
  }

  function withLatest(dep) {
    return registry.getLatest(dep.name)
      .then(latest => Object.assign({}, dep, {latest}));
  }

  return {check};
}

module.exports = depkeeper;
