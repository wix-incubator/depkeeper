'use strict';

const path = require('path');
const fs = require('fs');
const glob = require('glob');

function collect(cwd) {
  const pattern = path.join(cwd, 'node_modules', '**', 'package.json');
  return readGlob(pattern)
    .then(readPackages)
    .then(filterNoise);
}

function readGlob(pattern) {
  return new Promise((resolve, reject) => {
    glob(pattern, {nodir: true}, (err, files) =>
      err ? reject(err) : resolve(files));
  });
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
