'use strict';

const path = require('path');
const {expect} = require('chai');
const tp = require('../helpers/test-phases');
const createNpmrc = require('../../lib/npmrc');

describe('npmrc', () => {
  const test = tp.create();

  describe('.get()', () => {
    it('should read parameter from projects .npmrc', () => {
      test.setup({'.npmrc': `foo=bar`});
      return createNpmrc(test.tmp).get('foo').then(result =>
        expect(result).to.equal('bar'));
    });

    it('should continue looking for parameter in different .npmrc files', () => {
      const home = process.env.HOME;
      test.setup({'.npmrc': '', 'home/.npmrc': `foo=bar`});
      process.env.HOME = path.join(test.tmp, 'home');
      return createNpmrc(test.tmp).get('foo').then(result => {
        process.env.HOME = home;
        expect(result).to.equal('bar');
      });
    });
  });
});
