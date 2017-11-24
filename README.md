# depkeeper
A tool to detect outdated npm dependencies.

`depkeeper` goes over project dependencies inside `node_modules` and checks whether they are outdated or not. It's also possible to specify by how many versions behind the tool still tolerates the dependencies.

## Installation
To use as a library:
```
npm install --save-dev depkeeper
```
To use command line tool:
```
npm install -g depkeeper
```

## API
Start by requiring depkeeper.
```js
const depkeeper = require('depkeeper');
```

### Simple Usage
```js
depkeeper()
  .check()
  .then(outdated => {
    console.log(outdated); // [{name: 'eslint', version: '3.0.1',  minimal: '4.7.0', latest: '4.7.0'}]
  });
```
It will return a list of all outdated dependencies, no matter by how many versions they are behind. If all the dependencies are up to date, the list will be empty.

### Check By Thresholds
```js
depkeeper()
  .check('*', {major: 1})
  .then(outdated => {
    console.log(outdated); // [{name: 'eslint', version: '3.0.1', minimal: '4.0.0', latest: '5.7.0'}]
  });
```
It will return a list of outdated dependencies but only those that are behind by the specific amount of versions (thresholds).

### Handling Exceptions
Exceptions will reject the promise.
```js
depkeeper()
  .check()
  .catch(err => {
    throw err; // Something went wrong...
  });
```

NOTE: Unsuccessful attempts to reach registry or file system are swallowed. Still looking for a best way to pass them via API.

### Checking With Multiple Rules
It's possible to check specific dependencies by given [pattern](https://github.com/isaacs/minimatch) with separate thresholds.

```js
depkeeper()
  .rule('eslint-*')
  .rule('yoshi', {patch: 10})
  .checkRules()
  .then(outdated => {
    console.log(outdated);
    /*[
        [
          {name: 'eslint', version: '3.0.1', latest: 4.7.0'},
          {name: 'eslint-plugin-react', version: '6.1.6', latest: 7.4.0'},
        ],
        [
          {name: 'yoshi', version: '1.0.100', minimal: '1.0.189', latest: '1.0.199'}
        ]
      ]
    */
  });
```

### Factory
```js
const dk = depkeeper({
  cwd: 'string', // current working directory (default process.cwd())
  registryUrl: 'string' // override registry URL (default comes from .nvmrc or https://registry.npmjs.org)
});
```

### .check(pattern, thresholds)
`pattern` - `string`, default - `'*'`, glob [pattern](https://github.com/isaacs/minimatch) to mark specific dependencies to check
`thresholds` - `object`, `{major: number, minor: number, patch: number}`, specify by how many versions dependencies can be outdated

### .rule(pattern, thresholds) & .checkRules()
These two methods must be used together if you have multiple rules to check and don't want to deal with separate promises.
It works exactly the same as `.check()` just that you build all your rules first and then execute them at once.

### Multiple Thresholds
When passing multiple thresholds the rules will be combined. Minimal version will be calculated as following.
- `{major: 0, minor: 0, patch: 0}` - latest patch of latest minor of latest major (basically latest)
- `{major: 0, patch: 0}` - latest patch of lowest minor of latest major
- `{major: 0, minor: 0}` - lowest patch of latest minor of latest major
- `{minor: 0, patch: 0}` - latest patch of latest minor of current major
- `{major: 0}` - lowest patch of lowest minor of latest major
- `{minor: 0}` - lowest patch of latest minor of current major
- `{patch: 0}` - latest patch of current minor of current major

Passing positive numbers as thresholds will calculate by how many versions the specific version type is outdated.
- `{major: 1, minor: 2}` - patch outdated by 2 of lowest minor of major outdated by 1
- `{minor: 3}` - lowest patch of minor outdated by 3 of current major

*Note:* when there's no version which is outdated by specific threshold the algorithm will fallback to lowest. Look at the example bellow.

Given threshold is `{minor: 0, patch: 2}`, current version is `1.0.0`.
Rule says preserve major and take the latest minor with patch outdated by 2 versions.
Let's assume there are only these versions of major version 1: `1.0.0`, `1.1.0`, `1.1.1`, `1.1.2`, `1.1.3`, `1.2.0`, `1.2.1`.
As there is no patch outdated by 2 of latest minimal of current major, minimal version will be equal to lowest patch of latest minor of current major which is `1.2.0`.

## CLI
Running command `depkeeper check` will check and print the list of outdated dependencies.

WIP...

## Contribute
1. `git clone git@github.com:wix/depkeeper.git`
1. `cd depkeeper`
1. `npm install` or `yarn`
1. `npm test` or `yarn test`

In case of small bug, just create a PR otherwise please discuss inside an issue.
PR's without tests or with failing tests will be automatically rejected.

## License
[MIT](LICENSE)
