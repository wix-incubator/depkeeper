'use strict';

const fetch = require('node-fetch');
const semver = require('semver');

function registry(url) {
  function getVersions(name) {
    return fetchMeta(name)
      .then(meta => ({
        latest: getLatest(meta),
        versions: Object.keys(meta.versions).sort(semver.compare)
      }));
  }

  function getLatest(meta) {
    return (meta['dist-tags'] || {}).latest;
  }

  function fetchMeta(name) {
    return fetch(url + name)
      .then(resp => resp.json());
  }

  return {getVersions};
}

module.exports = registry;
