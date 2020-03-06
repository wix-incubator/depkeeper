'use strict';

const _url = require('url');
const fetch = require('node-fetch');
const semver = require('semver');
const createNpmrc = require('./npmrc');

const npmRegistry = 'https://registry.npmjs.org';

function registry({cwd, url, timeout = 5000}) {
  const npmrc = createNpmrc(cwd);

  function getVersions(name) {
    return getParams(name)
      .then(params => getMeta(params));
  }

  function getParams(name) {
    return getRegistryUrl(getScope(name))
      .then(regUrl => {
        // Reference: https://github.com/npm/npm/blob/24ec9f2dd4dcd4f25622dff3a502d4e86a025c0d/lib/config/get-credentials-by-uri.js
        const registryUrl = regUrl.replace(/\/$/, '') + '/';
        const nerfed = toNerfDart(registryUrl);
        return Promise.all([npmrc.get(`${nerfed}:_authToken`), registryUrl]);
      })
      .then(([token, registryUrl]) => ({name, token, registryUrl}));
  }

  function getRegistryUrl(scope) {
    if (url) {
      return Promise.resolve(url);
    }

    const scoped = scope ? [scope + ':registry'] : [];
    const names = scoped.concat('registry');

    return npmrc.get(names.shift())
      .then(registryUrl => {
        const name = names.shift();
        return registryUrl || (name && npmrc.get(name));
      })
      .then(registryUrl => registryUrl || npmRegistry);
  }

  function getMeta({registryUrl, name, token}) {
    let result;
    const headers = {
      'accept-encoding': 'gzip',
      accept: 'application/vnd.npm.install-v1+json; q=1.0, application/json; q=0.8, */*'
    };

    if (token) {
      headers.authorization = 'Bearer ' + token;
    }

    return fetch(registryUrl + name.replace('/', '%2F'), {headers, timeout})
      .then(resp => {
        const {status, statusText, ok} = resp;
        result = {status, statusText, ok};
        return ok ? (resp.status === 204 ? {} : resp.json()) : result;
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
    return Object.keys(versions || [])
      .filter(ver => !semver.prerelease(ver)) // TODO: should pre-released versions be filtered out?
      .sort(semver.compare);
  }

  function toNerfDart(uri) {
    const parsed = _url.parse(uri);
    ['protocol', 'auth', 'query', 'search', 'hash']
      .forEach(prop => delete parsed[prop]);

    return _url.resolve(_url.format(parsed), '.');
  }

  function getScope(name) {
    const match = name.match(/(^@.+?)\//);
    return match && match[1];
  }

  return {getRegistryUrl, getVersions};
}


module.exports = registry;
