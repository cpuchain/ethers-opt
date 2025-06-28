import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { describe, expect, it } from 'vitest';
import { getBlockReceipts, Provider } from '../src/index.js';

const ETH_RPC = 'https://rpc.mevblocker.io';

describe('blockReceipts.ts', function () {
    const ethFixture = async () => {
        const provider = new Provider(ETH_RPC);

        return { provider };
    };

    it('getBlockReceipts returns receipts for a block', async function () {
        const { provider } = await loadFixture(ethFixture);

        const block = await provider.getBlockNumber();
        const receipts = await getBlockReceipts(provider, block);
        expect(receipts).to.be.an('array');
    });
});
