'use strict';

const fetch = require('node-fetch');
const semver = require('semver');

function registry(url) {
  function getVersions(name) {
    return fetchMeta(name)
      .then(meta => ({
        latest: getLatest(meta),
        versions: extractVersions(meta.versions)
      }));
  }

  function getLatest(meta) {
    return (meta['dist-tags'] || {}).latest;
  }

  function fetchMeta(name) {
    return fetch(url + name)
      .then(resp => resp.json());
  }

  function extractVersions(versions) {
    return Object.keys(versions)
      .filter(ver => !semver.prerelease(ver)) // TODO: should pre-released versions be filtered out?
      .sort(semver.compare);
  }

  return {getVersions};
}

module.exports = registry;
