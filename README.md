# JavaScript big integers with support for ES6 BigInt and unboxed small integers

* Small integers are stored as 52 bit unboxed JS integers
* Larger integers are either represented by ES6 BigInts or by a fallback implementation

~~~ js
const I = require("bigint-unboxed");
const a = I.intAdd(I.I(1), I.I(2));
const b = I.intMul(I.I(3), I.I(2));
const c = I.intShl(I.I(1), 1234);
~~~
