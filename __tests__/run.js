const Eva = require('../src/Eva');
const Environment = require('../src/Environment');

const tests =
  [require('./block-test.js'),
   require('./variables-test.js'),
   require('./self-eval-test.js'),
   require('./math-test.js'),
   require('./if-test.js'),
   require('./while-test.js'),
   require('./logic-test.js')];

const eva = new Eva(new Environment({
  null: null,

  true: true,
  false: false,

  VERSION: '0.1',
}));

tests.forEach(test => test(eva));

console.log('All assertions passed!');
