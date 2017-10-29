'use strict';

const {expect} = require('chai');
const tp = require('../helpers/test-phases');
const createRegistry = require('../../lib/registry');

describe('registry', () => {
  let test;

  before(() => test = tp.create());

  describe('.getRegistryUrl()', () => {
    it('should return custom url', () => {
      const url = 'http://hello.computer';
      const registry = createRegistry('', url);
      return registry.getRegistryUrl().then(result =>
        expect(result).to.equal(url));
    });

    it('should return registry url from .npmrc', () => {
      const url = 'http://hello.computer';
      test.setup({'.npmrc': `registry=${url}`});
      const registry = createRegistry(test.tmp);
      return registry.getRegistryUrl().then(result =>
        expect(result).to.equal(url));
    });
  });

  describe('.getVersions()', () => {
    it('should return with empty versions when cannot reach npm server', () => {
      const registry = createRegistry(test.tmp, `http://non.existing.server`);
      return registry.getVersions('dep').then(data =>
        expect(data).to.eql({ok: false, statusText: 'Non Existing Server', versions: []}));
    });
  });
});
