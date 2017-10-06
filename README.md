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
    console.log(outdated); // [{dependency: 'eslint', version: '3.0.1', latest: 4.7.0'}]
  });
```

### Passing Thresholds
```js
depkeeper()
  .check({
    major: 1,
    minor: 1,
    patch: 1
  })
  .then(outdated => {
    console.log(outdated); // [{dependency: 'eslint', version: '3.0.1', minimal: '4.0.0' latest: 4.7.0'}]
  });
```

### Handling Exceptions
```js
depkeeper()
  .check()
  .catch(err => {
    throw err; // Something went wrong...
  });
```

### Passing Hooks
It's possible to omit some of the dependencies from being checked.

### Multiple Checks
It's possible to specify several thresholds and perform multiple checks.

## CLI
Running command `depkeeper check` will check and print the list of outdated dependencies.

WIP...

## Contribute
WIP...

## License
[MIT](LICENSE)
