const assert = require('assert');
const {test} = require('./test-util');

module.exports = eva => {
  test(eva,
    `
    (begin
      (var x 10)
      (switch (false 100)
              (false 200)
              (false 300)))
  `, null);

  test(eva,
    `
    (begin
      (var x 10)
      (switch ((= x 10) 100)
              ((> x 10) 200)
              (else     300))
    )
  `,
    100);
};
