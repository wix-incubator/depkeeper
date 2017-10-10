'use strict';

const semver = require('semver');

module.exports = function (current, versions, thresholds = {}) {
  const byMajor = filterBy('major', current, versions, thresholds);
  const byMinor = filterBy('minor', current, byMajor, thresholds);
  const byPatch = filterBy('patch', current, byMinor, thresholds);
  return byPatch.shift();
};

function filterBy(type, current, versions, thresholds) {
  const typeFunc = semver[type];
  const threshold = thresholds[type];
  const curr = typeFunc(current);
  const uniques = uniqueBy(type, versions);
  const minimalIndex = Math.max(0, uniques.length - 1 - threshold);
  const minimal = isNaN(threshold) ? curr : uniques[minimalIndex];
  return versions.filter(ver => minimal === typeFunc(ver));
}

function uniqueBy(type, versions) {
  const func = semver[type];
  return versions
    .map(ver => func(ver))
    .filter((ver, index, arr) => arr.indexOf(ver) === index);
}

