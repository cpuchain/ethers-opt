import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { describe, expect, it } from 'vitest';
import { deployERC20, getSigners } from '../src/hardhat/fixtures/index.js';
import { EthersBatcher } from '../src/index.js';

const RATE_PER_SECOND = 10;
const BATCH_SIZE = 5;
// 0ms delays because we query hardhat network
const DELAYS = 0;

describe('batcher.ts', function () {
    const commonFixture = async () => {
        const [owner] = await getSigners();

        const token = await deployERC20(owner);

        const batcher = new EthersBatcher({
            ratePerSecond: RATE_PER_SECOND,
            batchSize: BATCH_SIZE,
            delays: DELAYS,
        });

        return { owner, token, batcher };
    };

    it('getBlocks batch fetches blocks', async function () {
        const { owner, batcher } = await loadFixture(commonFixture);

        const provider = owner.provider;
        const blockNum = await provider.getBlockNumber();
        const blocks = await batcher.getBlocks(provider, [blockNum, blockNum - 1]);
        expect(blocks).to.have.length('2');
        expect(blocks[0]).to.have.property('number');
    });

    it('getTransactions returns txs', async function () {
        const { owner, batcher } = await loadFixture(commonFixture);

        const provider = owner.provider;
        const txResp = await owner.sendTransaction({ to: owner.address, value: 1 });
        await txResp.wait();
        const txResp2 = await owner.sendTransaction({ to: owner.address, value: 1 });
        await txResp2.wait();

        const [tx1, tx2] = await batcher.getTransactions(provider, [txResp.hash, txResp2.hash]);

        expect(tx1).to.have.property('hash', txResp.hash);
        expect(tx2).to.have.property('hash', txResp2.hash);
    });

    it('getTransactionReceipts returns receipts', async function () {
        const { owner, batcher } = await loadFixture(commonFixture);

        const provider = owner.provider;
        const txResp = await owner.sendTransaction({ to: owner.address, value: 1 });
        await txResp.wait();
        const txResp2 = await owner.sendTransaction({ to: owner.address, value: 1 });
        await txResp2.wait();

        const [tx1, tx2] = await batcher.getTransactionReceipts(provider, [txResp.hash, txResp2.hash]);

        expect(tx1).to.have.property('hash', txResp.hash);
        expect(tx2).to.have.property('hash', txResp2.hash);
    });

    it('getEvents returns events (single contract)', async function () {
        const { token, batcher } = await loadFixture(commonFixture);

        const events = await batcher.getEvents({
            contract: token,
            // hardhat fixture doesn't calculate block number correctly
            toBlock: 1000,
        });

        expect(events).to.be.a('array');
        expect(events.length).to.be.gte(1);
    });

    it('getEvents returns events (multi contract)', async function () {
        const { owner, token, batcher } = await loadFixture(commonFixture);
        const token2 = await deployERC20(owner);

        const events = await batcher.getEvents({
            address: [token.target as string, token2.target as string],
            contract: token,
            // hardhat fixture doesn't calculate block number correctly
            toBlock: 1000,
        });

        expect(events).to.be.a('array');
        expect(events.length).to.be.gte(2);
    });
});
