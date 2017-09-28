const {expect} = require('chai');
const dk = require('..');
const tp = require('./helpers/test-phases');

describe('depkeeper', () => {
  let test;

  beforeEach(() => {
    test = tp.create();
  });

  afterEach(() => test.teardown());

  describe('.check()', () => {
    it('should list dependencies', () => {
      const {tmp} = test.setup({
        'node_modules/dep1/package.json': createPackage('dep1', '4.0.13'),
        'node_modules/dep2/package.json': createPackage('dep2', '1.5.8')
      });

      return dk({cwd: tmp}).check().then(deps => {
        expect(deps).to.deep.equal([
          {name: 'dep1', version: '4.0.13'},
          {name: 'dep2', version: '1.5.8'}
        ]);
      });
    });
  });
});

function createPackage(name, version) {
  return JSON.stringify({name, version}, null, 2);
}
