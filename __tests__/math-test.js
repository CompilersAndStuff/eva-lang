const assert = require('assert');

module.exports = eva => {
  assert.strictEqual(eva.eval(['+', 5, 10]), 15);
  assert.strictEqual(eva.eval(['-', 5, 10]), -5);
  assert.strictEqual(eva.eval(['+', ['*', 2, 3], 5]), 11);
  assert.strictEqual(eva.eval(['+', ['/', 3, 3], 5]), 6);
};
