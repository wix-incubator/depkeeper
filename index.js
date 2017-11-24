'use strict';

const semver = require('semver');
const createModules = require('./lib/modules');
const findMinimal = require('./lib/find-minimal');

function depkeeper({cwd = process.cwd(), registryUrl} = {}) {
  const rulesQueue = [];
  const modules = createModules(cwd, registryUrl);

  function check(pattern = '*', options = {}) {
    return modules.pull(pattern)
      .then(deps => {
        const okDeps = deps.filter(dep => dep.ok);

        // TODO: figure out how to pass this info via API
        // const failed = deps.filter(dep => !dep.ok);

        return okDeps
          .map(dep => appendMinimal(dep, options))
          .filter(dep => isOutdated(dep, options))
          .map(filterOutNoise);
      });
  }

  function rule(pattern = '*', options) {
    rulesQueue.push(check(pattern, options));
    return this;
  }

  function checkRules() {
    return Promise.all(rulesQueue.splice(0));
  }

  function appendMinimal(dep, options) {
    const {version, versions} = dep;
    const thresholds = getThresholds(options);
    const {strategy = 'separate'} = options;
    const minimal = findMinimal[strategy](version, versions, thresholds);
    return Object.assign({}, dep, {minimal});
  }

  function isOutdated({version, minimal, latest}, options) {
    return !version || !latest || (hasThresholds(options) ? semver.lt(version, minimal) : semver.neq(version, latest));
  }

  function filterOutNoise(dep) {
    const whiteList = ['name', 'version', 'minimal', 'latest'];
    return whiteList.reduce((result, prop) => {
      if (prop in dep && dep[prop]) {
        result[prop] = dep[prop];
      }
      return result;
    }, {});
  }

  function hasThresholds(thresholds) {
    return ['major', 'minor', 'patch']
      .filter(type => !isNaN(thresholds[type]))
      .length !== 0;
  }

  function getThresholds({major, minor, patch}) {
    return {major, minor, patch};
  }

  return {rule, check, checkRules};
}

module.exports = depkeeper;
