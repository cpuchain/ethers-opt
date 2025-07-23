import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { describe, expect, it } from 'vitest';
import { deployERC20, getSigners } from '../src/hardhat/fixtures/index.js';
import { multicall, Provider } from '../src/index.js';

describe('multicall.ts', function () {
    const commonFixture = async () => {
        const [owner] = await getSigners();

        const Multicall = (owner.provider as Provider).multicall;

        const token = await deployERC20(owner);

        return { owner, Multicall, token };
    };

    it('calls aggregate3 via Multicall contract', async function () {
        const { owner, Multicall, token } = await loadFixture(commonFixture);

        // Deploy or use the deployed Multicall
        const calls = [
            {
                contract: Multicall,
                name: 'getEthBalance',
                params: [owner.address],
            },
            {
                contract: token,
                name: 'symbol',
            },
            {
                contract: token,
                name: 'decimals',
            },
            {
                contract: token,
                name: 'totalSupply',
            },
        ];

        const [ethBalance, symbol, decimals, totalSupply] = await multicall(Multicall, calls);

        expect(ethBalance).to.be.a('bigint');
        expect(symbol).to.be.a('string');
        expect(decimals).to.be.a('bigint');
        expect(totalSupply).to.be.a('bigint');
    });
});
