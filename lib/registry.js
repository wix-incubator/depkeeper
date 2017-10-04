'use strict';

const fetch = require('node-fetch');

function registry(url) {
  function getVersions(name) {
    return fetchMeta(name)
      .then(meta => ({
        latest: getLatest(meta),
        versions: meta.versions
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
