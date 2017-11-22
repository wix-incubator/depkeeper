'use strict';

const fetch = require('node-fetch');
const semver = require('semver');
const createNpmrc = require('./npmrc');

const npmRegistry = 'https://registry.npmjs.org';

function registry({cwd, url, timeout = 5000}) {
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

    return fetch(regUrl.replace(/\/$/, '') + '/' + name, {timeout})
      .then(resp => {
        const {status, statusText, ok} = resp;
        result = {status, statusText, ok};
        return resp.json();
      })
      .then(meta => Object.assign(result, {
        latest: getLatest(meta),
        versions: extractVersions(meta.versions)
      }))
      .catch(err => ({versions: [], ok: false, statusText: makeStatusText(err)}));
  }

  function makeStatusText({type = '', code = ''}) {
    return type + (code ? ': ' + code : '');
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
