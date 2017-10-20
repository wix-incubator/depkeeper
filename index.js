'use strict';

const semver = require('semver');
const {collectDeps, depsByIncludes} = require('./lib/deps');
const createRegistry = require('./lib/registry');
const findMinimal = require('./lib/find-minimal');

function depkeeper({cwd = process.cwd(), registryUrl} = {}) {
  const registry = createRegistry(cwd, registryUrl);
  const rules = [];

  function rule(pattern, thresholds) {
    rules.push({pattern, thresholds});
    return this;
  }

  function check() {
    const _rules = resetRules();
    const includes = _rules.reduce((acc, {pattern}) => acc.concat(pattern), []);
    return collectDeps(cwd, includes)
      .then(deps => Promise.all(deps.map(withVersions)))
      .then(deps => processRules(_rules, deps));
  }

  function resetRules() {
    return rules.splice(0);
  }

  function withVersions(dep) {
    return registry.getVersions(dep.name)
      .then(versions => Object.assign({}, dep, versions));
  }

  function processRules(ruleList, deps) {
    return ruleList.map(aRule => processRule(aRule, deps));
  }

  function processRule({pattern, thresholds}, deps) {
    return depsByIncludes(deps, pattern)
      .map(dep => appendMinimal(dep, thresholds))
      .filter(dep => isOutdated(dep, thresholds))
      .map(filterOutNoise);
  }

  function appendMinimal(dep, thresholds) {
    return Object.assign({}, dep, {minimal: findMinimal(dep.version, dep.versions, thresholds)});
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
