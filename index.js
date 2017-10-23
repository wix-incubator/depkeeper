'use strict';

const semver = require('semver');
const createModules = require('./lib/modules');
const findMinimal = require('./lib/find-minimal');

function depkeeper({cwd = process.cwd(), registryUrl} = {}) {
  const rules = [];
  const modules = createModules(cwd, registryUrl);

  function check(pattern, thresholds) {
    return modules.collect(pattern)
      .then(deps => {
        const okDeps = deps.filter(dep => dep.ok);

        // TODO: figure out how to pass this info via API
        // const failed = deps.filter(dep => !dep.ok);

        return okDeps
          .map(dep => appendMinimal(dep, thresholds))
          .filter(dep => isOutdated(dep, thresholds))
          .map(filterOutNoise);
      });
  }

  function rule(pattern, thresholds) {
    rules.push({pattern, thresholds});
    return this;
  }

  function checkRules() {
    return Promise.all(
      resetRules().map(({pattern, thresholds}) =>
        check(pattern, thresholds))
    );
  }

  function resetRules() {
    return rules.splice(0);
  }

  function appendMinimal(dep, thresholds) {
    const result = Object.assign({}, dep, {minimal: findMinimal(dep.version, dep.versions, thresholds)});
    return result;
  }

  function isOutdated({version, minimal, latest}, thresholds) {
    return !version || !latest || thresholds ? semver.lt(version, minimal) : semver.neq(version, latest);
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

  return {rule, check, checkRules};
}

module.exports = depkeeper;
