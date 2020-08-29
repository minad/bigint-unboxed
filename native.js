/**
 * @file
 * Adapter for native JavaScript BigInt support
 */

if (typeof BigInt === "undefined")
    throw new Error("BigInt is undefined");

const ZERO = BigInt(0), ONE = BigInt(1);

function I(x) {
    if (typeof x === "number")
        return BigInt(x);
    return x[0] === "-" ? -BigInt("0x" + x.substr(1)) : BigInt("0x" + x);
}

function intDiv(x, y) {
    const m = x % y, q = x / y;
    return (m === ZERO || (m < ZERO) === (y < ZERO)) ? q : q - ONE;
}

function intToFloat64(x)      { return Number(x); }
function intCmp(x, y)  { return (x > y) - (x < y); }
function intAdd(x, y)  { return x + y; }
function intSub(x, y)  { return x - y; }
function intMul(x, y)  { return x * y; }
function intAnd(x, y)  { return x & y; }
function intOr(x, y)   { return x | y; }
function intXor(x, y)  { return x ^ y; }
function intNot(x)     { return ~x; }
function intNeg(x)     { return -x; }
function intRem(x, y)  { return x % y; }
function intQuo(x, y)  { return x / y; }
function intShl(x, y)  { return x << BigInt(y); }
function intShr(x, y)  { return x >> BigInt(y); }

module.exports = {
    I, intToFloat64, intCmp, intAdd, intAnd, intDiv, intMul,
    intNeg, intNot, intOr, intQuo, intRem, intShl, intShr, intSub, intXor
};
