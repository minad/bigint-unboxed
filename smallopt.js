/**
 * @file
 * Wrapper for big integer library performing small integer optimization.
 * Small integers are stored as JavaScript numbers instead of as boxed objects.
 */

module.exports = function(B) {
    const BITS = 53,
        DIV = 0x100000000,
        MAX = Math.pow(2, BITS); // largest precise integer

    function isNum(x) {
        return typeof x === "number";
    }

    function areNums(x, y) {
        return isNum(x) && isNum(y);
    }

    function wrap(x) {
        return isNum(x) ? B.i(x) : x;
    }

    function i(x) {
        return isNum(x) ? x : B.i(x);
    }

    function i2n(x) {
        return isNum(x) ? x : B.i2n(x);
    }

    function icmp(x, y) {
        return areNums(x, y) ? (x > y) - (x < y) : B.icmp(wrap(x), wrap(y));
    }

    function idiv(x, y) {
        return areNums(x, y) ? Math.floor(x / y) : B.idiv(wrap(x), wrap(y));
    }

    function imod(x, y) {
        if (areNums(x, y)) {
            const m = x % y;
            return (m === 0 || (m < 0) === (y < 0)) ? m : m + y;
        }
        return B.imod(wrap(x), wrap(y));
    }

    function iadd(x, y) {
        if (areNums(x, y)) {
            const z = x + y;
            if (-MAX < z && z < MAX)
                return z;
        }
        return B.iadd(wrap(x), wrap(y));
    }

    function isub(x, y) {
        if (areNums(x, y)) {
            const z = x - y;
            if (-MAX < z && z < MAX)
                return z;
        }
        return B.isub(wrap(x), wrap(y));
    }

    function imul(x, y) {
        if (areNums(x, y)) {
            const z = x * y;
            if (-MAX < z && z < MAX)
                return z;
        }
        return B.imul(wrap(x), wrap(y));
    }

    function ibitop(op, x, y) {
        const ys = y < 0;
        let s = x < 0;
        x = s ? x + MAX : x;
        y = ys ? y + MAX : y;
        switch (op) {
        case 0: x = (((x / DIV) & (y / DIV)) >>> 0) * DIV + ((x & y) >>> 0); s &= ys; break;
        case 1: x = (((x / DIV) | (y / DIV)) >>> 0) * DIV + ((x | y) >>> 0); s |= ys; break;
        case 2: x = (((x / DIV) ^ (y / DIV)) >>> 0) * DIV + ((x ^ y) >>> 0); s ^= ys; break;
        }
        return s ? x - MAX : x;
    }

    function iand(x, y) {
        return areNums(x, y) ? ibitop(0, x, y) : B.iand(wrap(x), wrap(y));
    }

    function ior(x, y) {
        return areNums(x, y) ? ibitop(1, x, y) : B.ior(wrap(x), wrap(y));
    }

    function ixor(x, y) {
        return areNums(x, y) ? ibitop(2, x, y) : B.ixor(wrap(x), wrap(y));
    }

    function inot(x) {
        return isNum(x) ? ~x : B.inot(x);
    }

    function ineg(x) {
        return isNum(x) ? -x : B.ineg(x);
    }

    function irem(x, y) {
        return areNums(x, y) ? x % y : B.irem(wrap(x), wrap(y));
    }

    function iquot(x, y) {
        if (areNums(x, y))
            return x === 0 ? 0 : (x < 0) === (y < 0) ? Math.floor(x / y) : -Math.floor(-x / y);
        return B.iquot(wrap(x), wrap(y));
    }

    function ishl(x, y) {
        if (isNum(x) && y < BITS) {
            const z = x * Math.pow(2, y);
            if (-MAX < z && z < MAX)
                return z;
        }
        return B.ishl(wrap(x), y);
    }

    function ishr(x, y) {
        if (isNum(x)) {
            if (y > BITS)
                return x < 0 ? -1 : 0;
            return Math.floor(x / Math.pow(2, y));
        }
        return B.ishr(x, y);
    }

    return {
        i, i2n, icmp, iadd, iand, idiv, imod, imul,
        ineg, inot, ior, iquot, irem, ishl, ishr, isub, ixor
    };
};
