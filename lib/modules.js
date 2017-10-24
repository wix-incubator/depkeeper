'use strict';

const path = require('path');
const minimatch = require('minimatch');
const {readJSON} = require('./fs');
const createRegistry = require('./registry');

const depTypes = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies'
];

function modules(cwd, registryUrl) {
  let pullsQueue = [];
  const packagePath = path.join(cwd, 'package.json');
  const registry = createRegistry(cwd, registryUrl);

  function pull(pattern) {
    return new Promise((resolve, reject) => {
      if (!pullsQueue.length) {
        process.nextTick(collect);
      }
      pullsQueue = [...pullsQueue, {pattern, resolve, reject}];
    });
  }

  function collect() {
    const queue = resetQueue();
    const patterns = queue.map(item => item.pattern);

    getDepList(patterns)
      .then(getDepsWithPaths)
      .then(readPackages)
      .then(addVersions)
      .then(deps => releaseQueue(deps, queue))
      .catch(err => queue.forEach(item => item.reject(err)));
  }

  function resetQueue() {
    return pullsQueue.splice(0);
  }

  function getDepList(includes) {
    return readJSON(packagePath)
      .then(pkg => depTypes.reduce((acc, depType) => Object.assign(acc, pkg[depType]), {}))
      .then(Object.keys)
      .then(deps => depsByIncludes(deps, includes));
  }

  function getDepsWithPaths(deps) {
    return deps.map(name =>
      ({name, loc: path.join(cwd, 'node_modules', name, 'package.json')}));
  }

  function readPackages(deps) {
    return Promise.all(deps.map(readPackage));
  }

  function addVersions(deps) {
    return Promise.all(deps.map(dep =>
      dep.ok === false ? dep : registry.getVersions(dep.name)
        .then(versions => Object.assign({}, dep, versions))));
  }

  function releaseQueue(deps, queue) {
    queue.forEach(item => {
      item.resolve(deps.filter(dep => minimatch(dep.name, item.pattern)));
    });
  }

  function depsByIncludes(deps, includes = []) {
    includes = [].concat(includes);

    if (!includes.length || includes.includes('*')) {
      return deps;
    }

    return includes
      .reduce((acc, include) => acc.concat(deps.filter(dep => minimatch(dep, include))), [])
      .filter((dep, index, arr) => arr.indexOf(dep) === index);
  }

  function readPackage({name, loc}) {
    return readJSON(loc)
      .catch(() => ({name, ok: false, statusText: 'Not Installed'}));
  }

  return {pull, depsByIncludes};
}

module.exports = modules;
