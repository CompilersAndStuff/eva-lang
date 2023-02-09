const assert = require('assert');
const {test} = require('./test-util');

module.exports = eva => {
  test(eva, `(begin
               (def square (x) (* x x))
               (square 5))`,
    25)
  //Static scope test
  test(eva, `(begin
               (var x 10)
               (def x-identity () x)
               (def y () (begin
                           (var x 100)
                           (+ x (x-identity))))
               (y))`,
    110)
  test(eva, `(begin
               (def foo () 1)
               (foo))`,
       1)
  test(eva, `(begin
               (var value 100)
               (def calc (x y)
                 (begin
                   (var z (+ x y))
                   (def inner (foo)
                     (+ (+ foo z) value))
                   inner))
                (var fn (calc 10 20))
                (fn 30))`,
       160)

  test(eva,
    `(begin
          (def factorial (x)
            (if (= x 1)
              1
              (* x (factorial (- x 1)))))

          (factorial 5))`, 120)
};
