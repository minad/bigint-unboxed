/**
 * @file
 * Adapter for native JavaScript BigInt support
 */

/* eslint-disable no-var */
var BigInt;
/* eslint-enable no-var */

if (typeof BigInt === "undefined")
    throw new Error("BigInt is undefined");

const ZERO = BigInt(0), ONE = BigInt(1);

function i(x) {
    if (typeof x === "number")
        return BigInt(x);
    return x[0] === "-" ? -BigInt("0x" + x.substr(1)) : BigInt("0x" + x);
}

function idiv(x, y) {
    const m = x % y, q = x / y;
    return (m === ZERO || (m < ZERO) === (y < ZERO)) ? q : q - ONE;
}

function imod(x, y) {
    const m = x % y;
    return (m === ZERO || (m < ZERO) === (y < ZERO)) ? m : m + y;
}

function i2n(x)      { return Number(x); }
function icmp(x, y)  { return (x > y) - (x < y); }
function iadd(x, y)  { return x + y; }
function isub(x, y)  { return x - y; }
function imul(x, y)  { return x * y; }
function iand(x, y)  { return x & y; }
function ior(x, y)   { return x | y; }
function ixor(x, y)  { return x ^ y; }
function inot(x)     { return ~x; }
function ineg(x)     { return -x; }
function irem(x, y)  { return x % y; }
function iquot(x, y) { return x / y; }
function ishl(x, y)  { return x << BigInt(y); }
function ishr(x, y)  { return x >> BigInt(y); }

module.exports = {
    i, i2n, icmp, iadd, iand, idiv, imod, imul,
    ineg, inot, ior, iquot, irem, ishl, ishr, isub, ixor
};
