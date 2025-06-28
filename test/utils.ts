import { describe, expect, it } from 'vitest';
import {
    isNode,
    createBlockTags,
    range,
    chunk,
    sleep,
    digest,
    digestHex,
    rBytes,
    bufferToBytes,
    concatBytes,
    hexToBytes,
    bytesToHex,
    toEvenHex,
    toFixedHex,
    base64ToBytes,
    bytesToBase64,
    base64ToHex,
    hexToBase64,
    isHex,
    createBatchRateConfig,
} from '../src/index.js';

describe('utils.ts', function () {
    it('isNode should be boolean', function () {
        expect(isNode).to.be.a('boolean');
    });

    it('createBatchRateConfig: creates batch config compliant with RPC rate limits', function () {
        expect(createBatchRateConfig(1, 10, 0)).to.deep.equal({ concurrency: 1, batchSize: 1, delays: 0 });
        expect(createBatchRateConfig(1000, 10, 0)).to.deep.equal({
            concurrency: 100,
            batchSize: 10,
            delays: 0,
        });
        expect(createBatchRateConfig(1, 10, 1000)).to.deep.equal({
            concurrency: 1,
            batchSize: 1,
            delays: 1000,
        });
        expect(createBatchRateConfig(2, 10, 1000)).to.deep.equal({
            concurrency: 1,
            batchSize: 2,
            delays: 1000,
        });
        expect(createBatchRateConfig(3, 10, 1000)).to.deep.equal({
            concurrency: 1,
            batchSize: 3,
            delays: 1000,
        });
        expect(createBatchRateConfig(4, 10, 1000)).to.deep.equal({
            concurrency: 1,
            batchSize: 4,
            delays: 1000,
        });
        expect(createBatchRateConfig(5, 10, 1000)).to.deep.equal({
            concurrency: 1,
            batchSize: 5,
            delays: 1000,
        });
        expect(createBatchRateConfig(10, 10, 1000)).to.deep.equal({
            concurrency: 1,
            batchSize: 10,
            delays: 1000,
        });
        expect(createBatchRateConfig(100, 10, 1000)).to.deep.equal({
            concurrency: 10,
            batchSize: 10,
            delays: 1000,
        });
        expect(createBatchRateConfig(100, 10, 2000)).to.deep.equal({
            concurrency: 20,
            batchSize: 10,
            delays: 2000,
        });
        expect(createBatchRateConfig(100, 10, 10000)).to.deep.equal({
            concurrency: 100,
            batchSize: 10,
            delays: 10000,
        });
    });

    it('createBlockTags: creates correct batch ranges', function () {
        expect(createBlockTags(0, 999)).to.deep.equal([{ fromBlock: 0, toBlock: 999 }]);
        expect(createBlockTags(0, 1004, 1000)).to.deep.equal([
            { fromBlock: 0, toBlock: 999 },
            { fromBlock: 1000, toBlock: 1004 },
        ]);
    });

    it('createBlockTags: throws on invalid ranges', function () {
        expect(() => createBlockTags(10, 5)).to.throw('Invalid block range 10~5');
    });

    it('range: generates a numeric range', function () {
        expect(range(1, 4)).to.deep.equal([1, 2, 3, 4]);
        expect(range(0, 10, 2)).to.deep.equal([0, 2, 4, 6, 8, 10]);
    });

    it('chunk: splits array into chunks', function () {
        expect(chunk([1, 2, 3, 4, 5], 2)).to.deep.equal([[1, 2], [3, 4], [5]]);
        expect(chunk([], 2)).to.deep.equal([]);
    });

    it('sleep: resolves after at least the specified ms', async function () {
        const start = Date.now();
        await sleep(10);
        expect(Date.now() - start).to.be.at.least(8);
    });

    it('crypto: rBytes generates random bytes of correct length', function () {
        const bytes = rBytes(16);
        expect(bytes).to.be.instanceof(Uint8Array);
        expect(bytes.length).to.equal(16);
    });

    it('crypto: digest performs SHA-256 digest', async function () {
        const msg = new Uint8Array([1, 2, 3]);
        const hash = await digest(msg);
        expect(hash).to.be.instanceof(Uint8Array);
        expect(hash.length).to.equal(32);
    });

    it('crypto: digestHex hashes a hex string', async function () {
        const hex = '0x010203';
        const digestOut = await digestHex(hex);
        expect(digestOut).to.match(/^0x[0-9a-f]{64}$/i);
    });

    it('bufferToBytes: converts Buffer to Uint8Array', function () {
        const buf = Buffer.from([1, 2, 3]);
        const bytes = bufferToBytes(buf);
        expect(bytes).to.deep.equal(new Uint8Array([1, 2, 3]));
    });

    it('concatBytes: concatenates multiple Uint8Arrays', function () {
        const a = new Uint8Array([1, 2]);
        const b = new Uint8Array([3, 4]);
        expect(concatBytes(a, b)).to.deep.equal(new Uint8Array([1, 2, 3, 4]));
    });

    it('hexToBytes and bytesToHex: convert back and forth', function () {
        const hex = '0x01a3';
        const bytes = hexToBytes(hex);
        expect(bytesToHex(bytes)).to.equal('0x01a3');
    });

    it('hexToBytes: supports non-prefixed hex', function () {
        expect(hexToBytes('0f')).to.deep.equal(new Uint8Array([0x0f]));
    });

    it('hexToBytes: zero-pads uneven hex', function () {
        expect(hexToBytes('0xabc')).to.deep.equal(new Uint8Array([0x0a, 0xbc]));
    });

    it('toEvenHex: pads uneven hex and prefixes with 0x', function () {
        expect(toEvenHex('abc')).to.equal('0x0abc');
        expect(toEvenHex('0x0abc')).to.equal('0x0abc');
    });

    it('toFixedHex: pads to fixed hex length', function () {
        expect(toFixedHex(1, 2)).to.equal('0x0001');
        expect(toFixedHex('10', 1)).to.equal('0x0a');
    });

    it('bytesToBase64/base64ToBytes: roundtrip', function () {
        const arr = new Uint8Array([1, 2, 3]);
        const b64 = bytesToBase64(arr);
        expect(base64ToBytes(b64)).to.deep.equal(arr);
    });

    it('hex <-> base64 conversions', function () {
        const h = '0x54657374'; // "Test"
        const b64 = hexToBase64(h);
        expect(base64ToHex(b64)).to.equal('0x54657374');
    });

    it('isHex: detects hex strings', function () {
        expect(isHex('0x1234')).to.be.true;
        expect(isHex('0xABCD')).to.be.true;
        expect(isHex('1234')).to.be.false;
        expect(isHex('0xz12z')).to.be.false;
    });
});
