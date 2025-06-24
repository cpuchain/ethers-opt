"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.crypto = exports.isNode = void 0;
exports.createBatchRateConfig = createBatchRateConfig;
exports.createBlockTags = createBlockTags;
exports.range = range;
exports.chunk = chunk;
exports.sleep = sleep;
exports.digest = digest;
exports.digestHex = digestHex;
exports.rBytes = rBytes;
exports.bufferToBytes = bufferToBytes;
exports.concatBytes = concatBytes;
exports.hexToBytes = hexToBytes;
exports.bytesToHex = bytesToHex;
exports.toEvenHex = toEvenHex;
exports.toFixedHex = toFixedHex;
exports.base64ToBytes = base64ToBytes;
exports.bytesToBase64 = bytesToBase64;
exports.base64ToHex = base64ToHex;
exports.hexToBase64 = hexToBase64;
exports.isHex = isHex;
const crypto_1 = require("crypto");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (!BigInt.prototype.toJSON) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    BigInt.prototype.toJSON = function () {
        return this.toString();
    };
}
/**
 * Detects (heuristically) whether runtime is Node.js.
 * @returns {boolean} True if running in Node.js, false otherwise (browser).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
exports.isNode = !process?.browser && typeof globalThis.window === 'undefined';
/**
 * Computes optimal concurrency and batchSize for a given rate-per-second
 * limit and batch interval (delays), maximizing both under the constraint:
 *   concurrency * batchSize <= ratePerBatch
 *
 * We allow 0 delays to execute batches without delays but the batch size would remain the same
 *
 * @param {number} ratePerSecond - Maximum calls per second allowed.
 * @param {number} [maxBatch=5] - Maximum batch size.
 * @param {number} [delays=1000] - Fixed delay time for each batch (ms).
 * @returns {{ concurrency: number, batchSize: number, delays: number }} An object containing concurrency, batchSize, and delays.
 */
function createBatchRateConfig(ratePerSecond, maxBatch = 5, delays = 1000) {
    if (ratePerSecond < 1)
        throw new Error('ratePerSecond must be >= 1');
    if (maxBatch < 1)
        throw new Error('maxBatch must be >= 1');
    //if (delays < 1) throw new Error('delays must be >= 1');
    const _delays = delays > 1000 ? delays : 1000;
    const ratePerBatch = ratePerSecond * (_delays / 1000);
    // Highest batch not to exceed ratePerBatch and maxBatch
    const batch = Math.min(maxBatch, Math.floor(ratePerBatch));
    // At least 1
    const safeBatch = Math.max(batch, 1);
    // Maximum possible batchSize for this concurrency (>=1)
    const concurrency = Math.max(1, Math.floor(ratePerBatch / safeBatch));
    return {
        concurrency,
        batchSize: safeBatch,
        delays,
    };
}
/**
 * Creates an array of block tag ranges for batching.
 * @param {number} fromBlock - First block.
 * @param {number} toBlock - Last block.
 * @param {number} [batchSize=1000] - Number of blocks per batch.
 * @param {boolean} [reverse=false] - If true, returns ranges in reverse order.
 * @returns {Array<{fromBlock: number, toBlock: number}>} Array of objects specifying the range for each batch.
 * @throws {Error} If the block range is invalid.
 */
function createBlockTags(fromBlock, toBlock, batchSize = 1000, reverse = false) {
    const batches = [];
    if (toBlock - fromBlock > batchSize) {
        for (let i = fromBlock; i < toBlock + 1; i += batchSize) {
            const j = i + batchSize - 1 > toBlock ? toBlock : i + batchSize - 1;
            batches.push({ fromBlock: i, toBlock: j });
        }
    }
    else if (toBlock - fromBlock >= 0) {
        batches.push({ fromBlock, toBlock });
    }
    else {
        throw new Error(`Invalid block range ${fromBlock}~${toBlock}`);
    }
    if (reverse) {
        batches.reverse();
    }
    return batches;
}
/**
 * Generates a range of numbers (inclusive).
 * @param {number} start - First value.
 * @param {number} stop - Last value.
 * @param {number} [step=1] - Increment.
 * @returns {number[]} Array containing the generated range.
 */
function range(start, stop, step = 1) {
    return Array(Math.ceil((stop - start) / step) + 1)
        .fill(start)
        .map((x, y) => x + y * step);
}
/**
 * Splits an array into chunks of a given size.
 * @param {T[]} arr - Array to split.
 * @param {number} size - Maximum size of each chunk.
 * @returns {T[][]} An array of arrays, each with up to 'size' elements.
 * @template T
 */
function chunk(arr, size) {
    return [...Array(Math.ceil(arr.length / size))].map((_, i) => arr.slice(size * i, size + size * i));
}
/**
 * Returns a promise resolved after the specified duration.
 * @param {number} ms - Milliseconds to sleep.
 * @returns {Promise<void>} Promise that resolves after the delay.
 */
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
/**
 * Node/browser-compatible cryptography interface.
 */
exports.crypto = exports.isNode ? crypto_1.webcrypto : globalThis.crypto;
/**
 * Performs a digest (SHA-256 or other) of a byte array.
 * @param {Uint8Array} bytes - Input bytes.
 * @param {string} [algorithm='SHA-256'] - Algorithm name.
 * @returns {Promise<Uint8Array>} Digest as a Uint8Array.
 */
async function digest(bytes, algorithm = 'SHA-256') {
    return new Uint8Array(await exports.crypto.subtle.digest(algorithm, bytes));
}
/**
 * Hashes a hex string to another hex string digest.
 * @param {string} hexStr - Input hex string.
 * @param {string} [algorithm='SHA-256'] - Algorithm to use.
 * @returns {Promise<string>} Hex string (with 0x) of the digest.
 */
async function digestHex(hexStr, algorithm = 'SHA-256') {
    return bytesToHex(await digest(hexToBytes(hexStr), algorithm));
}
/**
 * Generates a cryptographically random byte buffer.
 * @param {number} [length=32] - Number of bytes.
 * @returns {Uint8Array} Randomly generated bytes.
 */
function rBytes(length = 32) {
    return exports.crypto.getRandomValues(new Uint8Array(length));
}
/**
 * Converts Node.js Buffer to Uint8Array.
 * @param {Buffer} b - Node.js Buffer.
 * @returns {Uint8Array} Converted Uint8Array.
 */
function bufferToBytes(b) {
    return Uint8Array.from(b);
}
/**
 * Concatenates multiple Uint8Arrays into one.
 * @param {...Uint8Array[]} arrays - Arrays to concatenate.
 * @returns {Uint8Array} New concatenated Uint8Array.
 */
function concatBytes(...arrays) {
    const totalSize = arrays.reduce((acc, e) => acc + e.length, 0);
    const merged = new Uint8Array(totalSize);
    arrays.forEach((array, i, arrays) => {
        const offset = arrays.slice(0, i).reduce((acc, e) => acc + e.length, 0);
        merged.set(array, offset);
    });
    return merged;
}
/**
 * Converts a 0x-prefixed hex string or bigint to a Uint8Array.
 * @param {bigint | string} input - The input hex string or bigint.
 * @returns {Uint8Array} The bytes.
 */
function hexToBytes(input) {
    let hex = typeof input === 'bigint' ? input.toString(16) : input;
    if (hex.startsWith('0x')) {
        hex = hex.slice(2);
    }
    if (hex.length % 2 !== 0) {
        hex = '0' + hex;
    }
    return Uint8Array.from(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
}
/**
 * Converts a Uint8Array to a 0x-prefixed hex string.
 * @param {Uint8Array} bytes - Input bytes.
 * @returns {string} Hex string of the bytes, 0x-prefixed.
 */
function bytesToHex(bytes) {
    return ('0x' +
        Array.from(bytes)
            .map((b) => b.toString(16).padStart(2, '0'))
            .join(''));
}
/**
 * Pads to even-length hex string and ensures 0x prefix.
 * @param {string} hexStr - Hex string with or without prefix.
 * @returns {string} 0x-prefixed, even-length hex string.
 */
function toEvenHex(hexStr) {
    if (hexStr.startsWith('0x')) {
        hexStr = hexStr.slice(2);
    }
    if (hexStr.length % 2 !== 0) {
        hexStr = '0' + hexStr;
    }
    return '0x' + hexStr;
}
/**
 * Converts a bigint/number/string into a 0x-prefixed, fixed-length-zero-padded hex string.
 * @param {bigint | number | string} numberish - The number, bigint, or numeric string.
 * @param {number} [length=32] - Number of bytes in output.
 * @returns {string} Fixed-length, 0x-prefixed hex string.
 */
function toFixedHex(numberish, length = 32) {
    return ('0x' +
        BigInt(numberish)
            .toString(16)
            .padStart(length * 2, '0'));
}
/**
 * Base64
 */
/**
 * Converts a base64 string to a Uint8Array.
 * @param {string} base64 - Input base64 string.
 * @returns {Uint8Array} Decoded bytes as a Uint8Array.
 */
function base64ToBytes(base64) {
    return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
}
/**
 * Converts bytes to a base64 string.
 * @param {Uint8Array} bytes - Bytes to encode.
 * @returns {string} Base64-encoded string.
 */
function bytesToBase64(bytes) {
    return btoa(bytes.reduce((data, byte) => data + String.fromCharCode(byte), ''));
}
/**
 * Converts a base64-encoded string to a 0x-prefixed hex string.
 * @param {string} base64 - Base64 string.
 * @returns {string} Hex string representation.
 */
function base64ToHex(base64) {
    return bytesToHex(base64ToBytes(base64));
}
/**
 * Converts a 0x-prefixed hex string to a base64 string.
 * @param {string} hex - Input hex string, prefixed or not.
 * @returns {string} Base64-encoded version.
 */
function hexToBase64(hex) {
    return bytesToBase64(hexToBytes(hex));
}
/**
 * Returns true if the string is a valid 0x-prefixed hex representation.
 * @param {string} value - String to check.
 * @returns {boolean} True if valid hex, false otherwise.
 */
function isHex(value) {
    return /^0x[0-9a-fA-F]*$/.test(value);
}
