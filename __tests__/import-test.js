const assert = require('assert');
const { test } = require('./test-util');

module.exports = eva => {
  test(eva,
    `(import (square) Math)

     (square 2 2)`, 4);

  test(eva,
    `
    (import Math)

    ((prop Math abs) (- 10))
`, 10);

  test(eva,
    `
    (var abs (prop Math abs))

    (abs (- 10))
`, 10);

  test(eva, `(prop Math MAX_VALUE)`, 1000);


  test(eva,
    `(import (square) Math)

     (square 5)`, 25);

  test(eva,
    `(import (cubic) Math)

     (cubic 5)`, 125);

  test(eva,
    `(import (mul) Math)

     (mul 2 2)`, undefined);
}
