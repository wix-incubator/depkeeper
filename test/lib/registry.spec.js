'use strict';

const {expect} = require('chai');
const tp = require('../helpers/test-phases');
const createRegistry = require('../../lib/registry');

describe('registry', () => {
  const test = tp.create();

  describe('.getRegistryUrl()', () => {
    it('should should allow to override url', () => {
      const url = 'http://hello.computer';
      const registry = createRegistry('', url);
      return registry.getRegistryUrl().then(result =>
        expect(result).to.equal(url));
    });

    it('should should read registry url from project .npmrc', () => {
      const url = 'http://hello.computer';
      test.setup({'.npmrc': `registry=${url}`});
      const registry = createRegistry(test.tmp);
      return registry.getRegistryUrl().then(result =>
        expect(result).to.equal(url));
    });
  });
});
