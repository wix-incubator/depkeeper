'use strict';

const {expect} = require('chai');
const shmock = require('shmock');
const cista = require('cista');
const createRegistry = require('../../lib/registry');

describe('registry', () => {
  describe('.getRegistryUrl()', () => {
    const url = 'http://hello.computer';

    it('should return custom url', () => {
      const {dir, cleanup} = cista();
      const registry = createRegistry({cwd: dir, url});
      return registry.getRegistryUrl()
        .then(result => expect(result).to.equal(url))
        .then(cleanup);
    });

    it('should return registry url from .npmrc', () => {
      const {dir, cleanup} = cista({'.npmrc': `registry=${url}`});
      const registry = createRegistry({cwd: dir});
      return registry.getRegistryUrl()
        .then(result => expect(result).to.equal(url))
        .then(cleanup);
    });

    it('should return @scope:registry url from .npmrc for a specific scope', () => {
      const scope = '@mars';
      const {dir, cleanup} = cista({'.npmrc': `${scope}:registry=${url}`});
      const registry = createRegistry({cwd: dir});
      return registry.getRegistryUrl(scope)
        .then(result => expect(result).to.equal(url))
        .then(cleanup);
    });

    it('should return registry url from .npmrc when no registry for specific scope', () => {
      const scope = '@mars';
      const {dir, cleanup} = cista({'.npmrc': `registry=${url}`});
      const registry = createRegistry({cwd: dir});
      return registry.getRegistryUrl(scope)
        .then(result => expect(result).to.equal(url))
        .then(cleanup);
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
      const {dir, cleanup} = cista();
      const registry = createRegistry({cwd: dir, url: `http://non.existing.server`});
      return registry.getVersions('dep')
        .then(data => expect(data).to.eql({ok: false, statusText: 'system: ENOTFOUND', versions: []}))
        .then(cleanup);
    });

    it('should return with empty versions when request timeout is more than 100ms', () => {
      const {dir, cleanup} = cista();
      npmServer.get('/dep').delay(110).reply(200);
      return createRegistry({cwd: dir, url, timeout: 100})
        .getVersions('dep')
        .then(data => {
          expect(data).to.eql({ok: false, statusText: 'request-timeout', versions: []});
          return delayTest(); // Need to delay test because of hanging response which has effect on the next test
        })
        .then(cleanup);
    });

    it('should pass an authorization header if exists', () => {
      const {dir, cleanup} = cista({'.npmrc': `registry=${url}\n${host}:_authToken=${token}`});
      npmServer
        .get('/@mars%2Fdep')
        .set('Authorization', 'Bearer ' + token)
        .reply(200, {});

      return createRegistry({cwd: dir})
        .getVersions('@mars/dep')
        .then(data =>
          expect(data).to.eql({ok: true, status: 200, statusText: 'OK', latest: undefined, versions: []}))
        .then(cleanup);
    });

    it('should handle case when cannot reach private package', () => {
      const {dir, cleanup} = cista();

      npmServer
        .get('/@mars%2Fdep')
        .reply(404, {error: 'Not found'});

      return createRegistry({cwd: dir, url})
        .getVersions('@mars/dep')
        .then(data =>
          expect(data).to.eql({ok: false, status: 404, statusText: 'Not Found', latest: undefined, versions: []}))
        .then(cleanup);
    });
  });
});

function delayTest(delay = 20) {
  return new Promise(resolve => setTimeout(resolve, delay));
}
