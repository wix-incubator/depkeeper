'use strict';

const fetch = require('node-fetch');
const semver = require('semver');
const createNpmrc = require('./npmrc');

const npmRegistry = 'https://registry.npmjs.org';

function registry(cwd, url) {
  const npmrc = createNpmrc(cwd);

  function getVersions(name) {
    return getRegistryUrl()
      .then(regUrl => getMeta(regUrl, name));
  }

  function getRegistryUrl() {
    if (url) {
      return Promise.resolve(url);
    }

    return npmrc.get('registry')
      .then(registryUrl => registryUrl || npmRegistry);
  }

  function getMeta(regUrl, name) {
    let result;

    return fetch(regUrl.replace(/\/$/, '') + '/' + name)
      .then(resp => {
        const {status, statusText, ok} = resp;
        result = {status, statusText, ok};
        return resp.json();
      })
      .then(meta => Object.assign(result, {
        latest: getLatest(meta),
        versions: extractVersions(meta.versions)
      }))
      .catch(() => Object.assign(result, {versions: []}));
  }

  function getLatest(meta) {
    return (meta['dist-tags'] || {}).latest;
  }

  function extractVersions(versions) {
    return Object.keys(versions)
      .filter(ver => !semver.prerelease(ver)) // TODO: should pre-released versions be filtered out?
      .sort(semver.compare);
  }

  return {getRegistryUrl, getVersions};
}


module.exports = registry;
