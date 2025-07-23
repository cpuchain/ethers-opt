import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { describe, expect, it } from 'vitest';
import { deployERC20, getSigners } from '../src/hardhat/fixtures/index.js';
import { compareBlockHashes, fetchBlockHashes } from '../src/index.js';

describe('blockHashes.ts', function () {
    const commonFixture = async () => {
        const [owner] = await getSigners();

        const token = await deployERC20(owner);

        return { owner, token };
    };

    it('fetchBlockHashes returns hashes for recent blocks', async function () {
        const { owner } = await loadFixture(commonFixture);

        const provider = owner.provider;
        const blocks = await fetchBlockHashes(provider, undefined, 1);
        expect(blocks).to.have.lengthOf('1');
        expect(blocks[0]).to.have.keys(['number', 'hash']);
    });

    it('compareBlockHashes detects differences', async function () {
        const a = [
            { number: 1, hash: '0x1' },
            { number: 2, hash: '0x2' },
            { number: 3, hash: '0x3' },
        ];
        const b = [
            { number: 1, hash: '0x1' },
            { number: 2, hash: '0x3' },
            { number: 3, hash: '0x4' },
        ];
        expect(compareBlockHashes(a, b)).to.eq(2);
    });
});
