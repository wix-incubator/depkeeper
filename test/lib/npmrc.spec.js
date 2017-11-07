'use strict';

const path = require('path');
const {expect} = require('chai');
const tp = require('../helpers/test-phases');
const createNpmrc = require('../../lib/npmrc');

describe('npmrc', () => {
  let test;

  const projectRc = path.join('.npmrc');
  const userRc = path.join('home', '.npmrc');
  const globalRc = path.join('nodejs', 'npm', 'etc', 'npmrc');
  const builtinRc = path.join('nodejs', 'lib', 'node_modules', 'npm', 'npmrc');

  before(() => test = tp.create());
  after(() => test.teardown());

  describe('.get()', () => {
    it('should read parameter from projects .npmrc', () => {
      const dir = setupRcs({[projectRc]: 'foo=bar'});
      return createNpmrc(dir).get('foo').then(result =>
        expect(result).to.equal('bar'));
    });

    it('should look for parameter in home config', () => {
      const dir = setupRcs({[userRc]: 'foo=bar'});
      const env = createEnv(dir);

      return createNpmrc(dir, env).get('foo').then(result =>
        expect(result).to.equal('bar'));
    });

    it('should look for parameter inside global config', () => {
      const dir = setupRcs({[globalRc]: 'foo=bar'});
      const env = createEnv(dir);

      return createNpmrc(dir, env).get('foo').then(result =>
        expect(result).to.equal('bar'));
    });

    it('should look for parameter inside builtin config', () => {
      const dir = setupRcs({[builtinRc]: 'foo=bar'});
      const env = createEnv(dir);

      return createNpmrc(dir, env).get('foo').then(result =>
        expect(result).to.equal('bar'));
    });

    it('should look for parameter inside global config with pre-configured prefix', () => {
      const dir = setupRcs({[globalRc]: 'foo=bar'});
      const env = createEnv(dir);
      const prefix = path.join(dir, globalRc, '..', '..');
      test.modify(builtinRc, `prefix=${prefix}`);
      return createNpmrc(dir, env).get('foo').then(result =>
        expect(result).to.equal('bar'));
    });
  });

  function setupRcs(override = {}) {
    const tree = {
      [projectRc]: '',
      [userRc]: '',
      [globalRc]: '',
      [builtinRc]: ''
    };
    test.setup(Object.assign(tree, override));
    return test.tmp;
  }

  function createEnv(cwd) {
    return {
      execPath: path.join(cwd, 'nodejs', 'bin', 'node'),
      homedir: path.join(cwd, 'home'),
      win32: false,
      appData: ''
    };
  }
});
