const bigint_backend = typeof BigInt !== "undefined" ? require("bigint-unboxed/native") : require("bigint-unboxed/fallback");
const bigint_smallopt = require("bigint-unboxed/smallopt");
module.exports = bigint_smallopt(bigint_backend);
