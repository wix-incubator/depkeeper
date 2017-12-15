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
    const url = 'http://hello.computer';

    it('should return custom url', () => {
      const registry = createRegistry({cwd, url});
      return registry.getRegistryUrl().then(result =>
        expect(result).to.equal(url));
    });

    it('should return registry url from .npmrc', () => {
      test.setup({'.npmrc': `registry=${url}`});
      const registry = createRegistry({cwd});
      return registry.getRegistryUrl().then(result =>
        expect(result).to.equal(url));
    });

    it('should return @scope:registry url from .npmrc for a specific scope', () => {
      const scope = '@mars';
      test.setup({'.npmrc': `${scope}:registry=${url}`});
      const registry = createRegistry({cwd});
      return registry.getRegistryUrl(scope).then(result =>
        expect(result).to.equal(url));
    });

    it('should return registry url from .npmrc when no registry for specific scope', () => {
      const scope = '@mars';
      test.setup({'.npmrc': `registry=${url}`});
      const registry = createRegistry({cwd});
      return registry.getRegistryUrl(scope).then(result =>
        expect(result).to.equal(url));
    });
  });

  describe('.getVersions()', () => {
    let npmServer;
    const port = 3333;
    const token = '123-abc-321';
    const host = `//localhost:${port}/`;
    const url = 'http:' + host;

    before(() => (npmServer = shmock(port)));
    afterEach(() => npmServer.clean());
    after(() => npmServer.close());

    it('should return with empty versions when cannot reach npm server', () => {
      const registry = createRegistry({cwd, url: `http://non.existing.server`});
      return registry.getVersions('dep').then(data =>
        expect(data).to.eql({ok: false, statusText: 'system: ENOTFOUND', versions: []}));
    });

    it('should return with empty versions when request timeout is more than 100ms', () => {
      npmServer.get('/dep').delay(110).reply(200);
      return createRegistry({cwd, url, timeout: 100})
        .getVersions('dep')
        .then(data => {
          expect(data).to.eql({ok: false, statusText: 'request-timeout', versions: []});
          return delayTest(); // Need to delay test because of hanging response which has effect on the next test
        });
    });

    it('should pass an authorization header if exists', () => {
      test.setup({'.npmrc': `registry=${url}\n${host}:_authToken=${token}`});
      npmServer
        .get('/@mars%2Fdep')
        .set('Authorization', 'Bearer ' + token)
        .reply(200, {});

      return createRegistry({cwd})
        .getVersions('@mars/dep')
        .then(data =>
          expect(data).to.eql({ok: true, status: 200, statusText: 'OK', latest: undefined, versions: []}));
    });

    it('should handle case when cannot reach private package', () => {
      npmServer
        .get('/@mars%2Fdep')
        .reply(404, {error: 'Not found'});

      return createRegistry({cwd, url})
        .getVersions('@mars/dep')
        .then(data =>
          expect(data).to.eql({ok: false, status: 404, statusText: 'Not Found', latest: undefined, versions: []}));
    });
  });
});

function delayTest(delay = 20) {
  return new Promise(resolve => setTimeout(resolve, delay));
}
