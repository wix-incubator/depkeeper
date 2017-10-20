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
  const registry = createRegistry(cwd, registryUrl);

  function collect(includes) {
    return getDepList(includes)
      .then(getDepsWithPaths)
      .then(readPackages)
      .then(addVersions);
  }

  function getDepList(includes) {
    const packagePath = path.join(cwd, 'package.json');
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

  function depsByIncludes(deps, includes = []) {
    // TODO: seems like code duplication, should probably use collect

    includes = [].concat(includes);

    if (!includes.length || includes.includes('*')) {
      return deps;
    }

    return includes
      .reduce((acc, include) => acc.concat(deps.filter(dep => minimatch(dep.name || dep, include))), [])
      .filter((dep, index, arr) => arr.indexOf(dep) === index);
  }

  function readPackage({name, loc}) {
    return readJSON(loc)
      .catch(() => ({name, ok: false, statusText: 'Not Installed'}));
  }

  return {collect, depsByIncludes};
}

module.exports = modules;
