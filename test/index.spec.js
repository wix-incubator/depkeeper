const {expect} = require('chai');
const dk = require('..');
const shmock = require('shmock');
const tp = require('./helpers/test-phases');


describe('depkeeper', () => {
  const port = 3333;
  const registryUrl = `http://localhost:${port}/`;
  const test = tp.create();
  const npmServer = shmock(port);

  afterEach(() => {
    test.teardown();
    npmServer.clean();
  });

  it('should return the list of outdated dependencies', () => {
    const {tmp} = test.setup({
      'node_modules/dep1/package.json': createPackage('dep1', '4.0.13'),
      'node_modules/dep2/package.json': createPackage('dep2', '1.5.8'),
      'package.json': createJSON(withDeps({dep1: '', dep2: ''}))
    });

    mockDependencyMeta('dep1', '5.0.1');
    mockDependencyMeta('dep2', '1.5.8');

    return dk({cwd: tmp, registryUrl})
      .rule('*')
      .check()
      .then(([outdated]) =>
        expect(outdated).to.deep.equal([{name: 'dep1', version: '4.0.13', latest: '5.0.1'}]));
  });

  it('should do nothing when there are no dependencies in package.json', () => {
    const {tmp} = test.setup({
      'package.json': createJSON()
    });

    return dk({cwd: tmp, registryUrl})
      .rule('*')
      .check().then(([outdated]) =>
        expect(outdated).to.deep.equal([]));
  });

  it.skip('should throw an error if there are no rules', () => {
    // TODO: implement
  });

  it.skip('should use version from the package.json when there is no dependency in filesystem', () => {
    // TODO: implement
  });

  it('should return a list of outdated dependencies according to pattern and rules', () => {
    const {tmp} = test.setup({
      'node_modules/dep/package.json': createPackage('dep', '1.0.0'),
      'node_modules/ped/package.json': createPackage('ped', '2.0.0'),
      'node_modules/edp/package.json': createPackage('edp', '3.0.0'),
      'package.json': createJSON(withDeps({dep: '', ped: '', edp: ''}))
    });

    mockDependencyMeta('dep', ['1.0.0', '1.0.1', '1.0.2']);
    mockDependencyMeta('ped', ['2.0.0', '2.0.1']);
    mockDependencyMeta('edp', ['3.0.0', '3.0.1']);

    return dk({cwd: tmp, registryUrl})
      .rule('d*', {patch: 1})
      .rule('ped')
      .check()
      .then(outdated =>
        expect(outdated).to.deep.equal([
          [{name: 'dep', version: '1.0.0', minimal: '1.0.1', latest: '1.0.2'}],
          [{name: 'ped', version: '2.0.0', latest: '2.0.1'}]
        ]));
  });

  it.skip('should check deps for itself', () => {
    return dk({cwd: '/Users/tomas/_code/wix-api-explorer', registryUrl: 'http://repo.dev.wixpress.com/artifactory/api/npm/npm-repos/'})
      .rule('wix-*', {major: 1, minor: 1, patch: 1})
      .check()
      .then(outdated => {
        console.log(outdated);
      });
  });

  /*
  1.0.0 - current
  1.0.1
  1.1.0
  1.2.0
  1.2.1
  1.3.0
  1.5.0
  1.5.1
  1.5.2
  2.0.0
  dk().check({patch: 0}) - minimal 1.0.1
  dk().check({minor: 0, patch: 0) - minimal 1.5.2
  dk().check({minor: 1, patch: 1) - minimal
  dk().check({minor: 'latest') - minimal 1.5.2
  dk().check({minor: 2, patch: 'latest') - minimal 1.2.1
  *.0.2

  dk().minorDiff() - 1.5.0
  dk().minorLate() - 1.5.2

  dk()
    .rule('react*', {minor: 1, patch: 1})
    .rule('wix-*', {major: 0, minor: 0, patch: 10})
    .rule('react', {major: 0, minor: 1})
    .rule('eslint', {minor: 1})
    .rule('*') // latest or pass all 0
    .check()
    .then(([react, wix, reactForWix, eslint, all]) => {
      if (wix.length && reactForWix) {
        console.log(wix);
        process.exit(1)
      }
    });
  */

  function createPackage(name, version) {
    return createJSON({name, version});
  }

  function withDeps(dependencies) {
    return {dependencies};
  }

  function createJSON(json = {}) {
    return JSON.stringify(json, null, 2);
  }

  function mockDependencyMeta(dep, versions) {
    versions = [].concat(versions);
    npmServer.get(`/${dep}`).reply(200, {
      _id: dep,
      name: dep,
      'dist-tags': {latest: versions.slice().pop()},
      versions: versions.reduce((acc, ver) => {
        acc[ver] = {};
        return acc;
      }, {})
    });
  }
});
