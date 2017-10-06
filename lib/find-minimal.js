'use strict';

const {major, minor, patch} = require('semver');


module.exports = function (current, versions, rules = {}) {
  return minimalByMajor(current, versions, rules.major || 0) ||
    minimalByMinor(current, versions, rules.minor || 0) ||
    minimalByPatch(current, versions, rules.patch || 0) ||
    null;
};

function minimalByMajor(current, versions, majorVer) {
  if (majorVer) {
    const latest = versions.slice().pop();
    const lowestSupported = versions
      .filter(ver => major(latest) - major(ver) <= majorVer)
      .shift();

    return major(current) <= major(lowestSupported) ? lowestSupported : null;
  }
}

function minimalByMinor(current, versions, minorVer) {
  if (minorVer) {
    const byMajor = versions.filter(ver => major(current) === major(ver));
    const latest = byMajor.slice().pop();
    const lowestSupported = byMajor
      .filter(ver => minor(latest) - minor(ver) <= minorVer)
      .shift();

    return minor(current) <= minor(lowestSupported) ? lowestSupported : null;
  }
}

function minimalByPatch(current, versions, patchVer) {
  if (patchVer) {
    const byMajorAndMinor = versions.filter(ver =>
      major(current) === major(ver) && minor(current) === minor(ver));
    const latest = byMajorAndMinor.slice().pop();

    const lowestSupported = byMajorAndMinor
      .filter(ver => patch(latest) - patch(ver) <= patchVer)
      .shift();

    return patch(current) <= patch(lowestSupported) ? lowestSupported : null;
  }
}
