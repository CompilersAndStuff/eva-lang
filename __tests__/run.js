const Eva = require('../src/Eva');
const Environment = require('../src/Environment');

const tests =
  [
   require('./block-test.js'),
   require('./variables-test.js'),
   require('./self-eval-test.js'),
   require('./math-test.js'),
   require('./if-test.js'),
   require('./while-test.js'),
   require('./logic-test.js'),
   require('./built-in-function-test.js'),
   require('./user-defined-function-test.js'),
   require('./lambda-function-test.js'),
   require('./switch-expression-test.js'),
   require('./for-test.js'),
   require('./dec-test.js'),
   require('./dec-val-test.js'),
   require('./inc-test.js'),
   require('./inc-val-test.js'),
   require('./class-test.js'),
   require('./import-test.js'),
   require('./module-test.js')
  ];

const eva = new Eva();

tests.forEach(test => test(eva));

// eva.eval(['print', ['seq', 1, 2, 3, '"some-string"', '"something"']]);

console.log('All assertions passed!');
