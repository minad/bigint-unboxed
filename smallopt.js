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
        return isNum(x) ? B.I(x) : x;
    }

    function I(x) {
        return isNum(x) ? x : B.I(x);
    }

    function intToFloat64(x) {
        return isNum(x) ? x : B.intToFloat64(x);
    }

    function intCmp(x, y) {
        return areNums(x, y) ? (x > y) - (x < y) : B.intCmp(wrap(x), wrap(y));
    }

    function intDiv(x, y) {
        return areNums(x, y) ? Math.floor(x / y) : B.intDiv(wrap(x), wrap(y));
    }

    function intMod(x, y) {
        if (areNums(x, y)) {
            const m = x % y;
            return (m === 0 || (m < 0) === (y < 0)) ? m : m + y;
        }
        return B.intMod(wrap(x), wrap(y));
    }

    function intAdd(x, y) {
        if (areNums(x, y)) {
            const z = x + y;
            if (-MAX < z && z < MAX)
                return z;
        }
        return B.intAdd(wrap(x), wrap(y));
    }

    function intSub(x, y) {
        if (areNums(x, y)) {
            const z = x - y;
            if (-MAX < z && z < MAX)
                return z;
        }
        return B.intSub(wrap(x), wrap(y));
    }

    function intMul(x, y) {
        if (areNums(x, y)) {
            const z = x * y;
            if (-MAX < z && z < MAX)
                return z;
        }
        return B.intMul(wrap(x), wrap(y));
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

    function intAnd(x, y) {
        return areNums(x, y) ? ibitop(0, x, y) : B.intAnd(wrap(x), wrap(y));
    }

    function intOr(x, y) {
        return areNums(x, y) ? ibitop(1, x, y) : B.intOr(wrap(x), wrap(y));
    }

    function intXor(x, y) {
        return areNums(x, y) ? ibitop(2, x, y) : B.intXor(wrap(x), wrap(y));
    }

    function intNot(x) {
        return isNum(x) ? ~x : B.intNot(x);
    }

    function intNeg(x) {
        return isNum(x) ? -x : B.intNeg(x);
    }

    function intRem(x, y) {
        return areNums(x, y) ? x % y : B.intRem(wrap(x), wrap(y));
    }

    function intQuot(x, y) {
        if (areNums(x, y))
            return x === 0 ? 0 : (x < 0) === (y < 0) ? Math.floor(x / y) : -Math.floor(-x / y);
        return B.intQuot(wrap(x), wrap(y));
    }

    function intShl(x, y) {
        if (isNum(x) && y < BITS) {
            const z = x * Math.pow(2, y);
            if (-MAX < z && z < MAX)
                return z;
        }
        return B.intShl(wrap(x), y);
    }

    function intShr(x, y) {
        if (isNum(x)) {
            if (y > BITS)
                return x < 0 ? -1 : 0;
            return Math.floor(x / Math.pow(2, y));
        }
        return B.intShr(x, y);
    }

    return {
        I, intToFloat64, intCmp, intAdd, intAnd, intDiv, intMod, intMul,
        intNeg, intNot, intOr, intQuot, intRem, intShl, intShr, intSub, intXor
    };
};
