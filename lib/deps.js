'use strict';

const path = require('path');
const fs = require('fs');

const depTypes = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies'
];

function collect(cwd) {
  return getDepPaths(cwd)
    .then(readPackages)
    .then(filterNoise);
}

function getDepPaths(cwd) {
  return getDepList(cwd)
    .then(list => list.map(dep =>
      path.join(cwd, 'node_modules', dep, 'package.json')));
}

function getDepList(cwd) {
  const packagePath = path.join(cwd, 'package.json');
  return readJSON(packagePath)
    .then(pkg => depTypes.reduce((acc, depType) =>
      Object.assign(acc, pkg[depType]), {}))
    .then(Object.keys);
}

function readPackages(paths) {
  return Promise.all(paths.map(readJSON));
}

function filterNoise(packages) {
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

module.exports = {collect};
