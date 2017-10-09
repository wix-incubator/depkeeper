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

  describe('.check()', () => {
    it('should return the list of outdated dependencies', () => {
      const {tmp} = test.setup({
        'node_modules/dep1/package.json': createPackage('dep1', '4.0.13'),
        'node_modules/dep2/package.json': createPackage('dep2', '1.5.8'),
        'package.json': createJSON(withDeps({dep1: '', dep2: ''}))
      });

      mockDependencyMeta('dep1', '5.0.1');
      mockDependencyMeta('dep2', '1.5.8');

      return dk({cwd: tmp, registryUrl}).check().then(outdated =>
        expect(outdated).to.deep.equal([{name: 'dep1', version: '4.0.13', latest: '5.0.1'}]));
    });

    it('should do nothing when there are no dependencies in package.json', () => {
      const {tmp} = test.setup({
        'package.json': createJSON()
      });

      return dk({cwd: tmp, registryUrl}).check().then(outdated =>
        expect(outdated).to.deep.equal([]));
    });

    it.skip('should use version from the package.json when there is no dependency in filesystem', () => {
      // TODO: implement
    });

    it('should return list of outdated dependencies by specific rules', () => {
      const {tmp} = test.setup({
        'node_modules/dep1/package.json': createPackage('dep1', '1.0.0'),
        'node_modules/dep2/package.json': createPackage('dep2', '2.0.0'),
        'package.json': createJSON(withDeps({dep1: '', dep2: ''}))
      });

      mockDependencyMeta('dep1', ['1.0.0', '1.0.1', '1.0.2', '2.0.0', '2.0.1']);
      mockDependencyMeta('dep2', ['1.0.0', '2.0.0', '2.0.1', '3.0.1']);

      return dk({cwd: tmp, registryUrl}).check({patch: 1}).then(outdated =>
        expect(outdated).to.deep.equal([{
          name: 'dep1',
          version: '1.0.0',
          minimal: '1.0.1',
          latest: '2.0.1'
        }]));
    });

    it('should check only dependencies that match pattern', () => {
      const {tmp} = test.setup({
        'node_modules/dep/package.json': createPackage('dep', '1.0.0'),
        'node_modules/ped/package.json': createPackage('ped', '2.0.0'),
        'node_modules/edp/package.json': createPackage('edp', '3.0.0'),
        'package.json': createJSON(withDeps({dep: '', ped: '', edp: ''}))
      });

      mockDependencyMeta('dep', ['1.0.0', '1.0.1']);
      mockDependencyMeta('ped', ['2.0.0', '2.0.1']);
      mockDependencyMeta('edp', ['3.0.0', '3.0.1']);

      return dk({cwd: tmp, registryUrl})
        .include('d*')
        .include('ped')
        .check()
        .then(outdated =>
          expect(outdated).to.deep.equal([
            {name: 'dep', version: '1.0.0', latest: '1.0.1'},
            {name: 'ped', version: '2.0.0', latest: '2.0.1'}
          ]));
    });

    it.skip('should check deps for itself', () => {
      return dk({cwd: '/Users/tomas/_code/wix-api-explorer', registryUrl: 'http://repo.dev.wix/artifactory/api/npm/npm-repos/'}).check({major: 1, minor: 1, patch: 1}).then(outdated => {
        console.log(outdated);
      });
    });
  });

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
