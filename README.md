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
## Simple Usage
```js
const depkeeper = require('depkeeper');

depkeeper().check()
  .then(outdated => {
    console.log(outdated); // [{ dependency: 'eslint', current: '3.0.1', latest: 4.7.0' }]
  })
  .catch(err => {
    throw err // Something went wrong...
  });
```

## CLI
Running command `depkeeper check` will check and print the list of outdated dependencies.

## Contribute
WIP...

## License
MIT
