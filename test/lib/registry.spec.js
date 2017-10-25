'use strict';

const path = require('path');
const {expect} = require('chai');
const tp = require('../helpers/test-phases');
const createRegistry = require('../../lib/registry');

describe('registry', () => {
  const test = tp.create();

  describe('.getRegistryUrl()', () => {
    it('should allow to override the url', () => {
      const url = 'http://hello.computer';
      const registry = createRegistry('', url);
      return registry.getRegistryUrl().then(result =>
        expect(result).to.equal(url));
    });

    it('should read registry url from projects .npmrc', () => {
      const url = 'http://hello.computer';
      test.setup({'.npmrc': `registry=${url}`});
      const registry = createRegistry(test.tmp);
      return registry.getRegistryUrl().then(result =>
        expect(result).to.equal(url));
    });

    it('should continue looking for registry url when .npmrc has no registry', () => {
      const url = 'http://hello.computer';
      const home = process.env.HOME;
      test.setup({'.npmrc': '', 'home/.npmrc': `registry=${url}`});
      process.env.HOME = path.join(test.tmp, 'home');
      const registry = createRegistry(test.tmp);
      return registry.getRegistryUrl().then(result => {
        process.env.HOME = home;
        expect(result).to.equal(url);
      });
    });
  });
});
