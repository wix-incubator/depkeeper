'use strict';

const {expect} = require('chai');
const findMinimal = require('../../lib/find-minimal');

describe('find-minimal.js', () => {
  it('should match by major', () => {
    const current = '1.0.0';
    const versions = ['1.0.0', '2.0.0', '3.0.0', '4.0.0'];
    const rules = {major: 1};
    expect(findMinimal(current, versions, rules)).to.equal('3.0.0');
  });

  it('should match by minor', () => {
    const current = '1.0.0';
    const versions = ['1.0.0', '1.1.0', '1.1.1', '1.2.0', '2.0.0'];
    const rules = {minor: 1};
    expect(findMinimal(current, versions, rules)).to.equal('1.1.0');
  });

  it('should match by patch', () => {
    const current = '1.0.0';
    const versions = ['1.0.0', '1.0.1', '1.0.2', '2.0.0', '2.0.1'];
    const rules = {patch: 1};
    expect(findMinimal(current, versions, rules)).to.equal('1.0.1');
  });

  it('should match left to right when there is more than one rule', () => {
    const current = '1.0.0';
    const versions = ['1.0.0', '1.0.1', '1.0.2', '2.0.0', '2.0.1', '2.0.2', '3.0.0'];
    const rules = {major: 1, patch: 1};
    expect(findMinimal(current, versions, rules)).to.equal('2.0.0');
  });

  it('should not match by patch when versions listed not one by one', () => {
    const current = '1.0.0';
    const versions = ['1.0.0', '1.0.2'];
    const rules = {patch: 1};
    expect(findMinimal(current, versions, rules)).to.equal(null);
  });
});
