'use strict';

const path = require('path');
const fs = require('fs');
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
  return readJSON(packagePath)
    .then(pkg => depTypes.reduce((acc, depType) =>
      Object.assign(acc, pkg[depType]), {}))
    .then(deps => filterByIncludes(Object.keys(deps), includes));
}

function getDepPaths(cwd, deps) {
  return deps.map(dep =>
    path.join(cwd, 'node_modules', dep, 'package.json'));
}

function readPackages(paths) {
  return Promise.all(paths.map(readJSON));
}

function filterOutNoise(packages) {
  return packages.map(({name, version}) =>
    ({name, version}));
}

function readJSON(jsonPath) {
  return readFile(jsonPath).then(JSON.parse);
}

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) =>
      err ? reject(err) : resolve(data));
  });
}

function filterByIncludes(deps, includes = []) {
  return !includes.length ? deps : includes
    .reduce((acc, include) => acc.concat(deps.filter(minimatch.filter(include))), [])
    .filter((dep, index, arr) => arr.indexOf(dep) === index);
}

module.exports = collectDeps;
