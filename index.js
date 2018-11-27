/* eslint-disable no-var */
var BigInt;
/* eslint-enable no-var */
const bigint_backend = typeof BigInt !== "undefined" ? require("native") : require("minimal");
const bigint_smallopt = require("smallopt");
module.exports = bigint_smallopt(bigint_backend);
