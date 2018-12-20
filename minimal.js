/**
 * @file
 * Minimal immutable big integer library, which contains only what is needed by the Chili runtime.
 * The library is derived from Fedor Idutny's bn.js (MIT licensed, Copyright Fedor Idutny, 2015).
 */

"use strict";

const BITS = 26, SHIFT = 1 << BITS, SHIFT2 = SHIFT * SHIFT, MASK = SHIFT - 1,
      ONE = new Int(0, [1], 1), ZERO = new Int(0, [0], 1);

/** @constructor */
function Int(neg, val, len) {
    while (len > 1 && val[len - 1] === 0)
        --len;
    if (len === 1 && val[0] === 0)
        neg = 0;
    this.neg = neg;
    this.val = val;
    this.len = len;
}

Int.prototype.toString = function() {
    return intToString(this);
};

function intToString(a) {
    if (a.len < 3 || a.len === 3 && a.val[2] === 1)
        return intToFloat64(a).toString();
    let out = "", c = a;
    while (!izero(c)) {
        const r = modn(c, 1e7).toString();
        c = divn(c, 1e7);
        out = izero(c) ? r + out : "0000000".substr(r.length) + r + out;
    }
    return a.neg ? "-" + out : out;
}

function I(x) {
    return typeof x === "string" ? stringToInt(x) : float64ToInt(x);
}

function float64ToInt(n) {
    let neg = 0;
    if (n < 0) {
        neg = 1;
        n = -n;
    }
    n = n < SHIFT ? [n] :
        n < SHIFT2  ? [n & MASK, (n / SHIFT) & MASK] :
        [n & MASK, (n / SHIFT) & MASK, 1];
    return new Int(neg, n, n.length);
}

function ibits(a) {
    return (a.len - 1) * BITS + 32 - Math.clz32(a.val[a.len - 1]);
}

function stringToInt(s) {
    const neg = s[0] === "-" ? 1 : 0,
          len = Math.ceil(s.length / 6),
          a = new Array(len);
    for (let j = 0; j < len; ++j)
        a[j] = 0;
    let off = 0;
    for (let l = s.length, j = 0; l > neg; l -= 6) {
        let w = 0;
        for (let k = Math.max(neg, l - 6); k < l; ++k) {
            const c = s.charCodeAt(k) - 48;
            w <<= 4;
            w |= c >= 49 && c <= 54 ? c - 39
                : c >= 17 && c <= 22 ? c - 7
                : c;
        }
        a[j] |= (w << off) & MASK;
        a[j + 1] |= w >>> (BITS - off) & (MASK >> 4);
        off += 24;
        if (off >= BITS) {
            off -= BITS;
            ++j;
        }
    }
    return new Int(neg, a, len);
}

function iabs(x) {
    return x.neg ? intNeg(x) : x;
}

function intAdd(x, y) {
    if (x.neg && !y.neg)
        return intSub(y, intNeg(x));
    if (!x.neg && y.neg)
        return intSub(x, intNeg(y));
    if (x.len < y.len) {
        const t = x;
        x = y;
        y = t;
    }
    const z = new Array(x.len);
    let carry = 0;
    for (let j = 0; j < x.len; ++j) {
        const r = x.val[j] + (j < y.len ? y.val[j] : 0) + carry;
        z[j] = r & MASK;
        carry = r >>> BITS;
    }
    if (carry !== 0)
        z[x.len] = carry;
    return new Int(x.neg, z, z.length);
}

function intSub(x, y) {
    if (y.neg)
        return intAdd(x, intNeg(y));
    if (x.neg)
        return intNeg(intAdd(intNeg(x), y));

    const cmp = intCmp(x, y);
    if (cmp === 0)
        return ZERO;

    if (cmp < 0) {
        const t = x;
        x = y;
        y = t;
    }
    const z = new Array(x.length);
    let carry = 0, j;
    for (j = 0; j < x.len; ++j) {
        const r = x.val[j] - (j < y.len ? y.val[j] : 0) + carry;
        carry = r >> BITS;
        z[j] = r & MASK;
    }
    return new Int(cmp < 0 ? 1 : x.neg, z, Math.max(x.len, j));
}

function intShr(x, y)  {
    if (x.neg)
        return intSubn(intNeg(intShr(intNeg(intAddn(x, 1)), y)), 1);

    const r = y % BITS,
        s = Math.min((y - r) / BITS, x.len);

    if (x.len <= s)
        return ZERO;

    const z = x.val.slice(0),
          len = x.len - s,
          mask = MASK ^ ((MASK >>> r) << r);

    let carry = 0;
    for (let j = 0; j < len; ++j)
        z[j] = z[j + s];
    for (let j = len - 1; carry !== 0 || j >= 0; --j) {
        const word = z[j];
        z[j] = (carry << (BITS - r)) | (word >>> r);
        carry = word & mask;
    }
    return len === 0 ? ZERO : new Int(x.neg, z, len);
}

function intShl(x, y) {
    const z = x.val.slice(0),
          r = y % BITS,
          s = (y - r) / BITS,
          carryMask = (MASK >>> (BITS - r)) << (BITS - r);
    let len = x.len, carry = 0, j;

    if (r !== 0) {
        for (j = 0; j < x.len; ++j) {
            const newCarry = z[j] & carryMask;
            z[j] = ((z[j] - newCarry) << r) | carry;
            carry = newCarry >>> (BITS - r);
        }

        if (carry) {
            z[j] = carry;
            ++len;
        }
    }

    if (s !== 0) {
        for (j = len - 1; j >= 0; --j)
            z[j + s] = z[j];
        for (j = 0; j < s; ++j)
            z[j] = 0;
        len += s;
    }

    return new Int(x.neg, z, len);
}

function intAddn(x, y) {
    if (y < 0)
        return intSubn(x, -y);
    if (x.neg && x.len === 1 && x.val[0] < y)
        return new Int(0, [y - x.val[0]], 1);
    if (x.neg)
        return intNeg(intSubn(intNeg(x), y));
    const z = x.val.slice(0);
    z[0] += y;
    let j;
    for (j = 0; j < x.len && z[j] >= SHIFT; ++j) {
        z[j] -= SHIFT;
        if (j === x.len - 1)
            z[j + 1] = 1;
        else
            ++z[j + 1];
    }
    return new Int(x.neg, z, Math.max(x.len, j + 1));
}

function intSubn(x, y) {
    if (y < 0)
        return intAddn(x, -y);
    if (x.neg)
        return intNeg(intAddn(intNeg(x), y));
    const z = x.val.slice(0);
    z[0] -= y;
    if (x.len === 1 && z[0] < 0) {
        z[0] = -z[0];
        return new Int(1, z, 1);
    }
    for (let j = 0; j < x.len && z[j] < 0; ++j) {
        z[j] += SHIFT;
        --z[j + 1];
    }
    return new Int(x.neg, z, x.len);
}

function intShlsubmul(x, y, mul, shift) {
    const len = y.len + shift, z = x.val.slice(0);

    let zlen = x.len;
    while (zlen < len)
        z[zlen++] = 0;

    let carry = 0, j;
    for (j = 0; j < y.len; ++j) {
        const right = y.val[j] * mul,
              w = z[j + shift] + carry - (right & MASK);
        carry = (w >> BITS) - ((right / SHIFT) | 0);
        z[j + shift] = w & MASK;
    }
    for (; j < zlen - shift; ++j) {
        const u = z[j + shift] + carry;
        carry = u >> BITS;
        z[j + shift] = u & MASK;
    }

    if (carry === 0)
        return new Int(x.neg, z, zlen);

    carry = 0;
    for (j = 0; j < zlen; ++j) {
        const v = -z[j] + carry;
        carry = v >> BITS;
        z[j] = v & MASK;
    }
    return new Int(1, z, zlen);
}

function intDivmod(x, y) {
    if (izero(x))
        return [ZERO, ZERO];
    if (x.neg || y.neg) {
        const z = intDivmod(iabs(x), iabs(y));
        return [x.neg && y.neg ? z[0] : intNeg(z[0]), x.neg ? intNeg(z[1]) : z[1]];
    }
    if (y.len > x.len || intCmp(x, y) < 0)
        return [ZERO, x];

    let yhi = y.val[y.len - 1];
    const yhiBits = 32 - Math.clz32(yhi),
          shift = BITS - yhiBits;
    if (shift !== 0) {
        y = intShl(y, shift);
        x = intShl(x, shift);
        yhi = y.val[y.len - 1];
    }

    const m = x.len - y.len, q = new Array(m + 1);
    for (let j = 0; j < q.length; ++j)
        q[j] = 0;

    const diff = intShlsubmul(x, y, 1, m);
    if (!diff.neg) {
        x = diff;
        q[m] = 1;
    }

    for (let j = m - 1; j >= 0; --j) {
        q[j] = x.val[y.len + j] * SHIFT + x.val[y.len + j - 1];
        q[j] = Math.min((q[j] / yhi) | 0, MASK);
        x = intShlsubmul(x, y, q[j], j);
        while (x.neg) {
            --q[j];
            x = intNeg(intShlsubmul(intNeg(x), y, 1, j));
        }
    }
    return [new Int(0, q, q.length), shift ? intShr(x, shift) : x];
}

function modn(x, y) {
    const p = (1 << BITS) % y;
    let z = 0;
    for (let j = x.len - 1; j >= 0; --j)
        z = (p * z + x.val[j]) % y;
    return z;
}

function divn(x, y) {
    const z = new Array(x.len);
    let carry = 0;
    for (let j = x.len - 1; j >= 0; --j) {
        const w = x.val[j] + carry * SHIFT;
        z[j] = (w / y) | 0;
        carry = w % y;
    }
    return new Int(x.neg, z, x.len);
}

function izero(a) {
    return a.len === 1 && a.val[0] === 0;
}

function intToFloat64(x) {
    let r = 0;
    for (let j = x.len - 1; j >= 0; --j)
        r = r * SHIFT + x.val[j];
    return x.neg ? -r : r;
}

function intDiv(x, y) {
    const z = intDivmod(x, y), q = z[0], m = z[1];
    return (izero(m) || m.neg === y.neg) ? q : intSubn(q, 1);
}

function intMod(x, y) {
    const m = intDivmod(x, y)[1];
    return (izero(m) || m.neg === y.neg) ? m : intAdd(m, y);
}

function ibitop(op, x, y) {
    if (x.len < y.len) {
        const t = x;
        x = y;
        y = t;
    }
    let neg = x.neg;
    const yneg = y.neg,
          bits = Math.max(ibits(x), ibits(y)),
          max = neg || yneg ? intShl(ONE, bits + 1) : null;
    x = x.neg ? intAdd(max, x) : x;
    y = y.neg ? intAdd(max, y) : y;
    let z = x.val.slice(0), len = x.len;
    switch (op) {
    case 0:
        for (let j = 0; j < y.len; ++j)
            z[j] &= y.val[j];
        neg &= yneg;
        len = y.len;
        break;
    case 1:
        for (let j = 0; j < y.len; ++j)
            z[j] |= y.val[j];
        neg |= yneg;
        break;
    case 2:
        for (let j = 0; j < y.len; ++j)
            z[j] ^= y.val[j];
        neg ^= yneg;
        break;
    }
    z = new Int(0, z, len);
    return neg ? intSub(z, max) : z;
}

function intAnd(x, y) {
    return ibitop(0, x, y);
}

function intOr(x, y) {
    return ibitop(1, x, y);
}

function intXor(x, y) {
    return ibitop(2, x, y);
}

function intCmp(x, y)  {
    if (x.neg !== y.neg)
        return x.neg ? -1 : 1;
    if (x.len !== y.len)
        return (x.len < y.len) ^ x.neg ? -1 : 1;
    for (let j = x.len - 1; j >= 0; --j) {
        if (x.val[j] < y.val[j])
            return x.neg ? 1 : -1;
        if (x.val[j] > y.val[j])
            return x.neg ? -1 : 1;
    }
    return 0;
}

function intMul(x, y)  {
    const z = new Array(x.len + y.len);
    let carry = 0, hncarry = 0, k;
    for (k = 0; k < z.length - 1; k++) {
        const maxJ = Math.min(k, y.len - 1);
        let ncarry = hncarry, rword = carry & MASK;
        hncarry = 0;
        for (let j = Math.max(0, k - x.len + 1); j <= maxJ; ++j) {
            const r = x.val[k - j] * y.val[j], lo = (r & MASK) + rword;
            rword = lo & MASK;
            ncarry += ((r / SHIFT) | 0) + (lo >>> BITS);
            hncarry += ncarry >>> BITS;
            ncarry &= MASK;
        }
        z[k] = rword;
        carry = ncarry;
    }
    if (carry !== 0)
        z[k] = carry;
    return new Int(x.neg ^ y.neg, z, carry ? z.length : z.length - 1);
}

function intNot(x) {
    return intSubn(intNeg(x), 1);
}

function intNeg(x) {
    return new Int(izero(x) ? 0 : (x.neg ^ 1), x.val, x.len);
}

function intRem(x, y)  {
    return intDivmod(x, y)[1];
}

function intQuot(x, y) {
    return intDivmod(x, y)[0];
}

module.exports = {
    I, intToFloat64, intCmp, intAdd, intAnd, intDiv, intMod, intMul,
    intNeg, intNot, intOr, intQuot, intRem, intShl, intShr, intSub, intXor
};
