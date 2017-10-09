'use strict';

const semver = require('semver');
const {major, minor, compare} = semver;


module.exports = function (current, versions, rules = {}) {
  return minimalByMajor(current, versions, rules.major || 0) ||
    minimalByMinor(current, versions, rules.minor || 0) ||
    minimalByPatch(current, versions, rules.patch || 0) ||
    null;
};

function minimalByMajor(current, versions, majorVer) {
  if (majorVer) {
    const uniqueMajors = lowestUniqueOf('major', versions);
    const last = uniqueMajors.length - 1;
    const lowestSupported = uniqueMajors[last - majorVer];
    return lowestSupported && compare(current, lowestSupported) === -1 ? lowestSupported : null;
  }
}

function minimalByMinor(current, versions, minorVer) {
  if (minorVer) {
    const minorsOfMajor = versions.filter(ver => major(current) === major(ver));
    const uniqueMinorsOfMajor = lowestUniqueOf('minor', minorsOfMajor);
    const last = uniqueMinorsOfMajor.length - 1;
    const lowestSupported = uniqueMinorsOfMajor[last - minorVer];
    return lowestSupported && compare(current, lowestSupported) === -1 ? lowestSupported : null;
  }
}

function minimalByPatch(current, versions, patchVer) {
  if (patchVer) {
    const patchesOfMinorOfMajor = versions.filter(ver =>
      major(current) === major(ver) && minor(current) === minor(ver));
    const last = patchesOfMinorOfMajor.length - 1;
    const lowestSupported = patchesOfMinorOfMajor[last - patchVer];
    return lowestSupported && compare(current, lowestSupported) === -1 ? lowestSupported : null;
  }
}

function lowestUniqueOf(type, versions) {
  const check = semver[type];
  return versions.reduce((arr, ver) => {
    const last = arr.slice().pop();
    if (!last || check(last) !== check(ver)) {
      arr.push(ver);
    }
    return arr;
  }, []);
}
