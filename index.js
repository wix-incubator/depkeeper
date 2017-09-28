'use strict';

const deps = require('./lib/deps');

function depkeeper({cwd = process.cwd()} = {}) {

  function check(/*rules*/) {
    return deps.collect(cwd)
      .then(list => {
        return list;
      });
  }

  return {check};
}

module.exports = depkeeper;
