'use strict';

const path = require('path');
const fs = require('./fs');
const minimatch = require('minimatch');

const depTypes = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies'
];

function collectDeps(cwd, includes) {
  return getDepList(cwd, includes)
    .then(deps => getDepPaths(cwd, deps))
    .then(readPackages)
    .then(filterOutNoise);
}

function getDepList(cwd, includes) {
  const packagePath = path.join(cwd, 'package.json');
  return fs.readJSON(packagePath)
    .then(pkg => depTypes.reduce((acc, depType) => Object.assign(acc, pkg[depType]), {}))
    .then(Object.keys)
    .then(deps => depsByIncludes(deps, includes));
}

function getDepPaths(cwd, deps) {
  return deps.map(dep =>
    path.join(cwd, 'node_modules', dep, 'package.json'));
}

function readPackages(paths) {
  return Promise.all(paths.map(fs.readJSON));
}

function filterOutNoise(packages) {
  return packages.map(({name, version}) =>
    ({name, version}));
}

function depsByIncludes(deps, includes = []) {
  includes = [].concat(includes);

  if (!includes.length || includes.includes('*')) {
    return deps;
  }

  return includes
    .reduce((acc, include) => acc.concat(deps.filter(dep => minimatch(dep.name || dep, include))), [])
    .filter((dep, index, arr) => arr.indexOf(dep) === index);
}

module.exports = {collectDeps, depsByIncludes};
