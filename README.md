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
  .rules('*')
  .check()
  .then(([outdated]) => {
    console.log(outdated); // [{name: 'eslint', version: '3.0.1', latest: 4.7.0'}]
  });
```
This will return a list of all outdated dependencies, no matter by how many versions they are behind. If all the dependencies are up to date, the list will be empty.

### Check By Thresholds
```js
depkeeper()
  .rules('*', {major: 1})
  .check()
  .then(([outdated]) => {
    console.log(outdated); // [{name: 'eslint', version: '3.0.1', minimal: '4.0.0' latest: 5.7.0'}]
  });
```
This will return a list of outdated dependencies but only those that are behind by the specific amount of versions. Notice that it's possible to match only by one type of versions. Passing several thresholds will resolve from left to right: in other words, it will try to find outdated by major, then by minor and then by patch.

### Handling Exceptions
Exceptions will reject the promise.
```js
depkeeper()
  .rules('*')
  .check()
  .catch(err => {
    throw err; // Something went wrong...
  });
```

### Checking With Multiple Rules
It's possible to check specific dependencies by given [pattern](https://github.com/isaacs/minimatch) with separate thresholds.

```js
depkeeper()
  .rules('eslint-*')
  .rules('yoshi', {patch: 10})
  .check()
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

## CLI
Running command `depkeeper check` will check and print the list of outdated dependencies.

WIP...

## Contribute
WIP...

## License
[MIT](LICENSE)
