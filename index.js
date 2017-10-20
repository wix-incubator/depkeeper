'use strict';

const semver = require('semver');
const createModules = require('./lib/modules');
const findMinimal = require('./lib/find-minimal');

function depkeeper({cwd = process.cwd(), registryUrl} = {}) {
  const rules = [];
  const modules = createModules(cwd, registryUrl);

  function rule(pattern, thresholds) {
    rules.push({pattern, thresholds});
    return this;
  }

  function check() {
    const _rules = resetRules();
    const includes = _rules.reduce((acc, {pattern}) => acc.concat(pattern), []);
    return modules.collect(includes)
      .then(deps => processRules(_rules, deps));
  }

  function resetRules() {
    return rules.splice(0);
  }

  function processRules(ruleList, deps) {
    const okDeps = deps.filter(dep => dep.ok);
    // const failed = deps.filter(dep => !dep.ok); // TODO: figure out how to pass this info via API

    return ruleList.map(aRule => processRule(aRule, okDeps));
  }

  function processRule({pattern, thresholds}, deps) {
    return modules.depsByIncludes(deps, pattern) // TODO: refactor this part, looks like utility method that should not be on modules instance
      .map(dep => appendMinimal(dep, thresholds))
      .filter(dep => isOutdated(dep, thresholds))
      .map(filterOutNoise);
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

  return {rule, check};
}

module.exports = depkeeper;
