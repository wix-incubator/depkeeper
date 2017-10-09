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
    console.log(outdated); // [{name: 'eslint', version: '3.0.1', latest: 4.7.0'}]
  });
```
This will return a list of all outdated dependencies, no matter by how many versions they are behind. If all the dependencies are up to date, the list will be empty.

### Passing Thresholds (Rules)
```js
depkeeper()
  .check({
    major: 1,
    minor: 1,
    patch: 1
  })
  .then(outdated => {
    console.log(outdated); // [{name: 'eslint', version: '3.0.1', minimal: '4.0.0' latest: 4.7.0'}]
  });
```
This will return a list of outdated dependencies but only those that are behind by the specific amount of versions. Notice that it's possible to match only by one type of versions. Passing several thresholds will resolve from left to right: in other words, it will try to find outdated by major, then by minor and then by patch.

### Handling Exceptions
Exceptions will reject the promise.
```js
depkeeper()
  .check()
  .catch(err => {
    throw err; // Something went wrong...
  });
```

### Checking Only Specific Dependencies
It's possible to check only specific dependencies by given [pattern](https://github.com/isaacs/minimatch).

```js
depkeeper()
  .include('eslint-*')
  .check()
  .then(outdated => {
    console.log(outdated);
    /*
      [
        {name: 'eslint', version: '3.0.1', latest: 4.7.0'},
        {name: 'eslint-plugin-react', version: '6.1.6', latest: 7.4.0'},
      ]
    */
  });
```

### New API Proposal
```js
depkeeper().
  .major(1, 'eslint-*')
  .patch(10, 'yoshi')
  .check()
  .then(outdated => {
    console.log(outdated);
    /*
      [
        [{name: 'eslint', version: '3.0.1', minimal: '4.0.0', latest: '5.1.2'}],
        [{name: 'yoshi', version: '1.0.100', minimal: '1.0.189', latest: '1.0.199'}]
      ]
    */
  });
```

### Multiple Checks
It's possible to specify several thresholds and perform multiple checks.

## CLI
Running command `depkeeper check` will check and print the list of outdated dependencies.

WIP...

## Contribute
WIP...

## License
[MIT](LICENSE)
