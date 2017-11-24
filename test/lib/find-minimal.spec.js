'use strict';

const {expect} = require('chai');
const {numeral, separate} = require('../../lib/find-minimal');

const versions = ['1.0.0', '1.0.1', '1.0.2', '1.1.0', '1.2.0', '1.2.1', '2.0.0', '3.0.0', '3.0.1', '3.1.0', '3.2.0', '3.2.1'];

describe('find-minimal.js', () => {
  describe('numeral', () => {
    it('should throw an error if passing more than one threshold type', () => {
      const current = versions[2];
      const thresholds = {minor: 1, patch: 2};
      expect(() => numeral(current, versions, thresholds)).to.throw('numeral supports only one type of threshold');
    });

    it('should return latest if there\'s no threshold', () => {
      const current = versions[0];
      expect(numeral(current, versions, {})).to.equal('3.2.1');
    });

    it('should return 5 versions before latest', () => {
      const current = versions[1];
      const thresholds = {patch: 4};
      expect(numeral(current, versions, thresholds)).to.equal('3.0.0');
    });

    it('should return 4 versions before latest', () => {
      const current = versions[0];
      const thresholds = {minor: 3};
      expect(numeral(current, versions, thresholds)).to.equal('2.0.0');
    });

    it('should return 1 versions before latest of major', () => {
      const current = versions[2];
      const thresholds = {major: 1};
      expect(numeral(current, versions, thresholds)).to.equal('2.0.0');
    });
  });

  describe('separate', () => {
    it('should return latest patch of current minor of current major', () => {
      const current = '1.0.0';
      const thresholds = {patch: 0};
      expect(separate(current, versions, thresholds)).to.equal('1.0.2');
    });

    it('should return patch outdated by 1 of current minor of current major', () => {
      const current = '1.0.0';
      const thresholds = {patch: 1};
      expect(separate(current, versions, thresholds)).to.equal('1.0.1');
    });

    it('should return lowest patch of lowest minor of current major', () => {
      const current = '1.0.0';
      const thresholds = {minor: 0};
      expect(separate(current, versions, thresholds)).to.equal('1.2.0');
    });

    it('should return lowest patch of minor outdated by 1 of latest major', () => {
      const current = '1.0.0';
      const thresholds = {minor: 1};
      expect(separate(current, versions, thresholds)).to.equal('1.1.0');
    });

    it('should return latest patch of latest minor of current major', () => {
      const current = '1.0.0';
      const thresholds = {minor: 0, patch: 0};
      expect(separate(current, versions, thresholds)).to.equal('1.2.1');
    });

    it('should return lowest patch of lowest minor of latest major', () => {
      const current = '1.0.0';
      const thresholds = {major: 0};
      expect(separate(current, versions, thresholds)).to.equal('3.0.0');
    });

    it('should return lowest patch of lowest minor of major outdated by one', () => {
      const current = '1.0.0';
      const thresholds = {major: 1};
      expect(separate(current, versions, thresholds)).to.equal('2.0.0');
    });

    it('should return lowest patch of latest minor of latest major', () => {
      const current = '1.0.0';
      const thresholds = {major: 0, minor: 0};
      expect(separate(current, versions, thresholds)).to.equal('3.2.0');
    });

    it('should return latest patch of lowest minor of latest major', () => {
      const current = '1.0.0';
      const thresholds = {major: 0, patch: 0};
      expect(separate(current, versions, thresholds)).to.equal('3.0.1');
    });

    it('should return the same version if there is no minimal', () => {
      const current = '3.2.1';
      const thresholds = {major: 0, minor: 0, patch: 0};
      expect(separate(current, versions, thresholds)).to.equal('3.2.1');
    });

    it('should return the same version when there are no threshold', () => {
      const current = '1.0.0';
      expect(separate(current, versions)).to.equal('1.0.0');
    });

    it('should fallback to lowest patch when there is no patch of specific threshold', () => {
      const current = '3.0.0';
      const thresholds = {minor: 1, patch: 1};
      expect(separate(current, versions, thresholds)).to.equal('3.1.0');
    });

    it('should return latest patch of (fallback) lowest minor of major outdated by 1', () => {
      const current = '1.0.2';
      const thresholds = {major: 1, minor: 1, patch: 0};
      expect(separate(current, versions, thresholds)).to.equal('2.0.0');
    });
  });

});
