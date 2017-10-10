'use strict';

const {expect} = require('chai');
const findMinimal = require('../../lib/find-minimal');

const versions = ['1.0.0', '1.0.1', '1.0.2', '1.1.0', '1.2.0', '1.2.1', '2.0.0', '3.0.0', '3.0.1', '3.1.0', '3.2.0', '3.2.1'];

describe('find-minimal.js', () => {
  it('should return latest patch of current minor of current major', () => {
    const current = '1.0.0';
    const thresholds = {patch: 0};
    expect(findMinimal(current, versions, thresholds)).to.equal('1.0.2');
  });

  it('should return patch outdated by 1 of current minor of current major', () => {
    const current = '1.0.0';
    const thresholds = {patch: 1};
    expect(findMinimal(current, versions, thresholds)).to.equal('1.0.1');
  });

  it('should return lowest patch of lowest minor of latest major', () => {
    const current = '1.0.0';
    const thresholds = {minor: 0};
    expect(findMinimal(current, versions, thresholds)).to.equal('1.2.0');
  });

  it('should return lowest patch of minor outdated by 1 of latest major', () => {
    const current = '1.0.0';
    const thresholds = {minor: 1};
    expect(findMinimal(current, versions, thresholds)).to.equal('1.1.0');
  });

  it('should return latest patch of latest minor of current major', () => {
    const current = '1.0.0';
    const thresholds = {minor: 0, patch: 0};
    expect(findMinimal(current, versions, thresholds)).to.equal('1.2.1');
  });

  it('should return lowest patch of lowest minor of latest major', () => {
    const current = '1.0.0';
    const thresholds = {major: 0};
    expect(findMinimal(current, versions, thresholds)).to.equal('3.0.0');
  });

  it('should return lowest patch of lowest minor of major outdated by one', () => {
    const current = '1.0.0';
    const thresholds = {major: 1};
    expect(findMinimal(current, versions, thresholds)).to.equal('2.0.0');
  });

  it('should return lowest patch of latest minor of latest major', () => {
    const current = '1.0.0';
    const thresholds = {major: 0, minor: 0};
    expect(findMinimal(current, versions, thresholds)).to.equal('3.2.0');
  });

  it('should return latest patch of lowest minor of latest major', () => {
    const current = '1.0.0';
    const thresholds = {major: 0, patch: 0};
    expect(findMinimal(current, versions, thresholds)).to.equal('3.0.1');
  });

  it('should return the same version if there is no minimal', () => {
    const current = '3.2.1';
    const thresholds = {major: 0, minor: 0, patch: 0};
    expect(findMinimal(current, versions, thresholds)).to.equal('3.2.1');
  });

  it('should return the same version when there are no threshold', () => {
    const current = '1.0.0';
    expect(findMinimal(current, versions)).to.equal('1.0.0');
  });

  it('should fallback to lowest patch when there is no patch of specific threshold', () => {
    const current = '3.0.0';
    const thresholds = {minor: 1, patch: 1};
    expect(findMinimal(current, versions, thresholds)).to.equal('3.1.0');
  });

  it('should return latest patch of (fallback) lowest minor of major outdated by 1', () => {
    const current = '1.0.2';
    const thresholds = {major: 1, minor: 1, patch: 0};
    expect(findMinimal(current, versions, thresholds)).to.equal('2.0.0');
  });
});
