'use strict';

const fetch = require('node-fetch');

function registry(url) {
  function getLatest(name) {
    return fetchMeta(name)
      .then(meta => (meta['dist-tags'] || {}).latest);
  }

  function fetchMeta(name) {
    return fetch(url + name)
      .then(resp => resp.json());
  }

  return {getLatest};
}

module.exports = registry;
