const {expect} = require('chai');
const dk = require('..');
const shmock = require('shmock');
const cista = require('cista');


describe('depkeeper', () => {
  const port = 3333;
  const registryUrl = `http://localhost:${port}/`;
  let npmServer;

  before(() => npmServer = shmock(port));
  after(() => npmServer.close());
  afterEach(() => npmServer.clean());

  it('should return the list of outdated dependencies', () => {
    const {dir, cleanup} = cista({
      'node_modules/dep1/package.json': createPackage('dep1', '4.0.13'),
      'node_modules/dep2/package.json': createPackage('dep2', '1.5.8'),
      'package.json': createJSON(withDeps({dep1: '', dep2: ''}))
    });

    mockDependencyMeta('dep1', ['4.0.13', '5.0.1']);
    mockDependencyMeta('dep2', ['1.5.8', '1.5.8']);

    return dk({cwd: dir, registryUrl})
      .check()
      .then(outdated =>
        expect(outdated).to.deep.equal([{name: 'dep1', version: '4.0.13', minimal: '5.0.1', latest: '5.0.1'}]))
      .then(cleanup);
  });

  it('should do nothing when there are no dependencies in package.json', () => {
    const {dir, cleanup} = cista({
      'package.json': createJSON()
    });

    return dk({cwd: dir, registryUrl})
      .check()
      .then(outdated => expect(outdated).to.deep.equal([]))
      .then(cleanup);
  });

  it('should skip dependencies that are not installed on the file system', () => {
    const {dir, cleanup} = cista({
      'package.json': createJSON(withDeps({dep: ''}))
    });

    return dk({cwd: dir, registryUrl})
      .check()
      .then(outdated => expect(outdated).to.deep.equal([]))
      .then(cleanup);
  });

  it('should not consider dependencies that cannot be reached on registry', () => {
    const {dir, cleanup} = cista({
      'node_modules/dep/package.json': createPackage('dep', '4.0.13'),
      'package.json': createJSON(withDeps({dep: ''}))
    });

    return dk({cwd: dir, registryUrl})
      .check()
      .then(outdated => expect(outdated).to.deep.equal([]))
      .then(cleanup);
  });

  it('should return a list of outdated dependencies according to pattern and rules', () => {
    const {dir, cleanup} = cista({
      'node_modules/dep/package.json': createPackage('dep', '1.0.0'),
      'node_modules/ped/package.json': createPackage('ped', '2.0.0'),
      'node_modules/edp/package.json': createPackage('edp', '3.0.0'),
      'package.json': createJSON(withDeps({dep: '', ped: '', edp: ''}))
    });

    mockDependencyMeta('dep', ['1.0.0', '1.0.1', '1.0.2']);
    mockDependencyMeta('ped', ['2.0.0', '2.0.1']);
    mockDependencyMeta('edp', ['3.0.0', '3.0.1']);

    return dk({cwd: dir, registryUrl})
      .rule('d*', {patch: 1})
      .rule('ped')
      .checkRules()
      .then(outdated =>
        expect(outdated).to.deep.equal([
          [{name: 'dep', version: '1.0.0', minimal: '1.0.1', latest: '1.0.2'}],
          [{name: 'ped', version: '2.0.0', minimal: '2.0.1', latest: '2.0.1'}]
        ]))
      .then(cleanup);
  });

  it('should allow to specify several rules on the same dependency', () => {
    const {dir, cleanup} = cista({
      'node_modules/dep/package.json': createPackage('dep', '1.0.0'),
      'package.json': createJSON(withDeps({dep: ''}))
    });

    mockDependencyMeta('dep', ['1.0.0', '1.0.1', '1.0.2', '2.0.0', '3.0.0']);

    return dk({cwd: dir, registryUrl})
      .rule('dep', {major: 1})
      .rule('dep', {patch: 3})
      .checkRules()
      .then(outdated =>
        expect(outdated).to.deep.equal([
          [{name: 'dep', version: '1.0.0', minimal: '2.0.0', latest: '3.0.0'}],
          [{name: 'dep', version: '1.0.0', minimal: '1.0.1', latest: '3.0.0'}]
        ]))
      .then(cleanup);
  });

  it('should allow to specify \'separate\' strategy', () => {
    const {dir, cleanup} = cista({
      'node_modules/dep/package.json': createPackage('dep', '1.0.0'),
      'package.json': createJSON(withDeps({dep: ''}))
    });

    mockDependencyMeta('dep', ['1.0.0', '1.0.1', '1.0.2', '2.0.0', '3.0.0']);

    return dk({cwd: dir, registryUrl})
      .check('*', {patch: 1, strategy: 'separate'})
      .then(outdated =>
        expect(outdated).to.deep.equal([{name: 'dep', version: '1.0.0', minimal: '1.0.1', latest: '3.0.0'}]))
      .then(cleanup);
  });

  it.skip('should use version from the package.json when there is no dependency in filesystem', () => {
    // TODO: implement as a feature
  });

  it.skip('should pay attention to globally installed dependencies', () => {
    // TODO: implement
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
