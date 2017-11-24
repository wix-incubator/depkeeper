'use strict';

const semver = require('semver');

module.exports = {numeral, separate};

function numeral(current, versions, thresholds = {}) {
  const {type = 'patch', threshold = 0} = singleThreshold(thresholds);
  const unique = {
    patch: versions.slice(),
    minor: uniqueOf(['major', 'minor'], versions),
    major: uniqueOf(['major'], versions)
  }[type];

  const result = unique[unique.length - 1 - threshold];
  return result && semver.gt(result, current) ? result : current;
}

function separate(current, versions, thresholds = {}) {
  const byMajor = filterBy('major', current, versions, thresholds);
  const byMinor = filterBy('minor', current, byMajor, thresholds);
  const byPatch = filterBy('patch', current, byMinor, thresholds);
  return byPatch.shift();
}

function singleThreshold(thresholds) {
  const types = Object.keys(thresholds).filter(type => !isNaN(thresholds[type]));

  if (types.length > 1) {
    throw new Error('numeral supports only one type of threshold');
  }

  const type = types.shift();
  return {type, threshold: thresholds[type]};
}

function filterBy(type, current, versions, thresholds) {
  const typeFunc = semver[type];
  const threshold = thresholds[type];
  const uniques = uniqueOf([type], versions);
  const minimalIndex = Math.max(0, uniques.length - 1 - threshold);
  const minimal = isNaN(threshold) ? current : uniques[minimalIndex];
  return versions.filter(ver => typeFunc(minimal) === typeFunc(ver));
}

function uniqueOf(types, versions) {
  return versions
    .map(ver => types.map(type => semver[type](ver)).join('.'))
    .reduce((acc, ver, index, arr) => arr.indexOf(ver) === index ? [...acc, versions[index]] : acc, []);
}
