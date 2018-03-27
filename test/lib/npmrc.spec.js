'use strict';

const path = require('path');
const {expect} = require('chai');
const cista = require('cista');
const createNpmrc = require('../../lib/npmrc');

describe('npmrc', () => {

  const projectRc = path.join('.npmrc');
  const userRc = path.join('home', '.npmrc');
  const globalRc = path.join('nodejs', 'npm', 'etc', 'npmrc');
  const builtinRc = path.join('nodejs', 'lib', 'node_modules', 'npm', 'npmrc');

  describe('.get()', () => {
    it('should read parameter from projects .npmrc', () => {
      const {dir, cleanup} = setupRcs({[projectRc]: 'foo=bar'});
      return createNpmrc(dir).get('foo')
        .then(result => expect(result).to.equal('bar'))
        .then(cleanup);
    });

    it('should look for parameter in home config', () => {
      const {dir, cleanup} = setupRcs({[userRc]: 'foo=bar'});
      const env = createEnv(dir);

      return createNpmrc(dir, env).get('foo')
        .then(result => expect(result).to.equal('bar'))
        .then(cleanup);
    });

    it('should look for parameter inside global config', () => {
      const {dir, cleanup} = setupRcs({[globalRc]: 'foo=bar'});
      const env = createEnv(dir);

      return createNpmrc(dir, env).get('foo')
        .then(result => expect(result).to.equal('bar'))
        .then(cleanup);
    });

    it('should look for parameter inside builtin config', () => {
      const {dir, cleanup} = setupRcs({[builtinRc]: 'foo=bar'});
      const env = createEnv(dir);

      return createNpmrc(dir, env).get('foo')
        .then(result => expect(result).to.equal('bar'))
        .then(cleanup);
    });

    it('should look for parameter inside global config with pre-configured prefix', () => {
      const {dir, files, cleanup} = setupRcs({[globalRc]: 'foo=bar'});
      const env = createEnv(dir);
      const prefix = path.join(dir, globalRc, '..', '..');
      files[builtinRc] = `prefix=${prefix}`;

      return createNpmrc(dir, env).get('foo')
        .then(result => expect(result).to.equal('bar'))
        .then(cleanup);
    });
  });

  function setupRcs(override = {}) {
    const tree = {
      [projectRc]: '',
      [userRc]: '',
      [globalRc]: '',
      [builtinRc]: ''
    };
    return cista(Object.assign(tree, override));
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
