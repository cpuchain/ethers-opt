import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { describe, expect, it } from 'vitest';
import { formatEther } from 'ethers';
import {
    getRateToEth,
    getChainlinkPrice,
    OffchainOracle__factory,
    OFFCHAIN_ORACLE_ADDRESS,
    ERC20__factory,
    Provider,
} from '../src/index.js';

const ETH_RPC = 'https://rpc.mevblocker.io';
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';
const WBTC_ADDRESS = '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599';
const WSOL_ADDRESS = '0xD31a59c85aE9D8edEFeC411D448f90841571b89c';

describe('price.ts', function () {
    const commonFixture = async () => {
        const provider = new Provider(ETH_RPC);

        const oracle = OffchainOracle__factory.connect(OFFCHAIN_ORACLE_ADDRESS, provider);
        const usdt = ERC20__factory.connect(USDT_ADDRESS, provider);
        const wbtc = ERC20__factory.connect(WBTC_ADDRESS, provider);
        const wsol = ERC20__factory.connect(WSOL_ADDRESS, provider);

        return { provider, oracle, usdt, wbtc, wsol };
    };

    it('rateToEth', async function () {
        const { oracle, usdt, wbtc, wsol } = await loadFixture(commonFixture);

        const [usdtEth, wbtcEth, wsolEth] = await Promise.all([
            getRateToEth(oracle, usdt),
            getRateToEth(oracle, wbtc),
            getRateToEth(oracle, wsol),
        ]);

        const ethUsd = Number((1 / Number(formatEther(usdtEth))).toFixed(8));
        const btcUsd = Number((ethUsd * Number(formatEther(wbtcEth))).toFixed(8));
        const solUsd = Number((ethUsd * Number(formatEther(wsolEth))).toFixed(8));

        console.log(`1inch: ETH: $${ethUsd}, BTC: $${btcUsd}, SOL: $${solUsd}`);

        expect(ethUsd).to.be.gt(100);
        expect(btcUsd).to.be.gt(100);
        expect(solUsd).to.be.gt(1);
    });

    it('chainlink', async function () {
        const { provider } = await loadFixture(commonFixture);

        const [ethUsd, btcUsd, solUsd] = await Promise.all([
            getChainlinkPrice(provider, 'WETH'),
            getChainlinkPrice(provider, 'WBTC'),
            getChainlinkPrice(provider, 'SOL'),
        ]);

        console.log(`chainlink: ETH: $${ethUsd}, BTC: $${btcUsd}, SOL: $${solUsd}`);

        expect(ethUsd).to.be.gt(100);
        expect(btcUsd).to.be.gt(100);
        expect(solUsd).to.be.gt(1);
    });
});
