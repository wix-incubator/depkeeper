'use strict';

const {expect} = require('chai');
const shmock = require('shmock');
const tp = require('../helpers/test-phases');
const createRegistry = require('../../lib/registry');

describe('registry', () => {
  let test, cwd;

  before(() => {
    test = tp.create();
    cwd = test.tmp;
  });

  describe('.getRegistryUrl()', () => {
    it('should return custom url', () => {
      const url = 'http://hello.computer';
      const registry = createRegistry({cwd, url});
      return registry.getRegistryUrl().then(result =>
        expect(result).to.equal(url));
    });

    it('should return registry url from .npmrc', () => {
      const url = 'http://hello.computer';
      test.setup({'.npmrc': `registry=${url}`});
      const registry = createRegistry({cwd});
      return registry.getRegistryUrl().then(result =>
        expect(result).to.equal(url));
    });
  });

  describe('.getVersions()', () => {
    it('should return with empty versions when cannot reach npm server', () => {
      const registry = createRegistry({cwd, url: `http://non.existing.server`});
      return registry.getVersions('dep').then(data =>
        expect(data).to.eql({ok: false, statusText: 'system: ENOTFOUND', versions: []}));
    });

    it('should return with emtpy versions when request timeout is more than 1s', () => {
      const port = 3333;
      const npmServer = shmock(port);
      npmServer.get('/dep').delay(110).reply(200, {});
      const registry = createRegistry({cwd, url: `http://localhost:${port}`, timeout: 100});
      return registry.getVersions('dep').then(data => {
        expect(data).to.eql({ok: false, statusText: 'request-timeout', versions: []});
        npmServer.close();
      });
    });
  });
});
