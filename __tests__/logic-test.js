const assert = require('assert');

module.exports = eva => {
  assert.strictEqual(eva.eval(['and', 0, 'false']), 0);
  assert.strictEqual(eva.eval(['and', 'true', 'null']), null);
  assert.strictEqual(eva.eval(['and', 'true', 'true']), true);
  assert.strictEqual(eva.eval(['and', 'false', 'false']), false);
  assert.strictEqual(eva.eval(['and', 1, 100]), 100);

  assert.strictEqual(eva.eval(['or', 0, 'false']), false);
  assert.strictEqual(eva.eval(['or', 'true', 'null']), true);
  assert.strictEqual(eva.eval(['or', 'true', 'true']), true);
  assert.strictEqual(eva.eval(['or', 'false', 'false']), false);
  assert.strictEqual(eva.eval(['or', 1, 100]), 1);

  assert.strictEqual(eva.eval(['not', 1]), false);
  assert.strictEqual(eva.eval(['not', 0]), true);
  assert.strictEqual(eva.eval(['not', 'false']), true);
  assert.strictEqual(eva.eval(['not', 'true']), false);

  assert.strictEqual(eva.eval(['if', ['and', 'true', 0],
                               '"Truthy something"',
                               '"Falsy something"']),
                     'Falsy something');
  assert.strictEqual(eva.eval(['if', ['and', 'true', ['not', 0]],
                               '"Truthy something"',
                               '"Falsy something"']),
                     'Truthy something');
};
