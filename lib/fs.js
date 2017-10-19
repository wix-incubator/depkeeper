'use strict';

const fs = require('fs');

function readJSON(jsonPath) {
  return readFile(jsonPath).then(JSON.parse);
}

function readFile(filePath) {
  return new Promise((resolve, reject) => {
    fs.readFile(filePath, 'utf-8', (err, data) =>
      err ? reject(err) : resolve(data));
  });
}

module.exports = {readFile, readJSON};
