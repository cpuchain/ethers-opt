import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { deployERC20, getSigners } from '../src/fixtures';
import { getBlockReceipts } from '../src';

describe('blockReceipts.ts', function () {
    const commonFixture = async () => {
        const [owner] = await getSigners();

        const token = await deployERC20(owner);

        return { owner, token };
    };

    // Pending because `Method eth_getBlockReceipts is not supported`
    xit('getBlockReceipts returns receipts for a block', async function () {
        const { owner } = await loadFixture(commonFixture);

        const provider = owner.provider;
        const block = await provider.getBlockNumber();
        const receipts = await getBlockReceipts(provider, block);
        expect(receipts).to.be.an('array');
    });
});
