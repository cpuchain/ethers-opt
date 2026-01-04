import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { describe, beforeAll, expect, it } from 'vitest';
import { formatEther, Wallet, ZeroAddress } from 'ethers';
import { getSigners } from '../src/hardhat/fixtures/index.js';
import {
    GAS_PRICE_ORACLE_ADDRESS,
    getChainlinkPrice,
    Provider,
    ProxySigner,
    TransactionRequestWithFees,
    WETH__factory,
} from '../src/index.js';
import { WETH__factory as WETH__factory2 } from '../src/typechain-hardhat/index.js';

const ETH_RPC = 'https://rpc.mevblocker.io';
const BNB_RPC = 'https://bsc-dataseed.bnbchain.org';
const BASE_RPC = 'https://mainnet.base.org';
const ARB_RPC = 'https://arb1.arbitrum.io/rpc';

const WETH_ETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2';
const WBNB_BNB = '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c';
const WETH_BASE = '0x4200000000000000000000000000000000000006';
const WETH_ARB = '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1';

const TEST_MNEMONIC = 'test test test test test test test test test test test junk';
const TEST_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266';
const TEST_PRIVATEKEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';

const BNB_ADDRESS = '0x5a52E96BAcdaBb82fd05763E25335261B270Efcb';

describe('signer.ts', function () {
    let vitalikAddress: string;
    let ethUsd: number, bnbUsd: number;

    const commonFixture = async () => {
        const [owner, bob] = await getSigners({ autoValue: true });

        const weth = await new WETH__factory2(owner).deploy();
        await weth.waitForDeployment();

        return { owner, bob, provider: owner.provider as Provider, weth };
    };

    const ethFixture = async () => {
        const provider = new Provider(ETH_RPC);
        const signer = ProxySigner.fromAddress(vitalikAddress, provider, { autoValue: true });

        const weth = WETH__factory.connect(WETH_ETH, signer);

        const chainId = Number((await provider.getNetwork()).chainId);

        return { provider, signer, chainId, weth };
    };

    const bnbFixture = async () => {
        const provider = new Provider(BNB_RPC);
        const signer = ProxySigner.fromAddress(BNB_ADDRESS, provider, { autoValue: true });

        const wbnb = WETH__factory.connect(WBNB_BNB, signer);

        const chainId = Number((await provider.getNetwork()).chainId);

        return { provider, signer, chainId, wbnb };
    };

    const baseFixture = async () => {
        const provider = new Provider(BASE_RPC);
        const signer = ProxySigner.fromAddress(vitalikAddress, provider, {
            autoValue: true,
            opGasPriceOracle: GAS_PRICE_ORACLE_ADDRESS,
        });

        const weth = WETH__factory.connect(WETH_BASE, signer);

        const chainId = Number((await provider.getNetwork()).chainId);

        return { provider, signer, chainId, weth };
    };

    const arbFixture = async () => {
        const provider = new Provider(ARB_RPC);
        const signer = ProxySigner.fromAddress(vitalikAddress, provider, { autoValue: true });

        const weth = WETH__factory.connect(WETH_ARB, signer);

        const chainId = Number((await provider.getNetwork()).chainId);

        return { provider, signer, chainId, weth };
    };

    beforeAll(async function () {
        const provider = new Provider(ETH_RPC);

        vitalikAddress = (await provider.resolveName('vitalik.eth')) as string;

        if (!vitalikAddress) {
            throw new Error('Invalid vitalik.eth address');
        }

        [ethUsd, bnbUsd] = await Promise.all([
            getChainlinkPrice(provider, 'ETH'),
            getChainlinkPrice(provider, 'BNB'),
        ]);
    });

    it('fromMnemonic', async function () {
        const { provider } = await loadFixture(commonFixture);

        const signer = ProxySigner.fromMnemonic(TEST_MNEMONIC, provider);

        expect(signer.address).to.equal(TEST_ADDRESS);
        expect((signer.parentSigner as Wallet).privateKey).to.equal(TEST_PRIVATEKEY);
    });

    it('fromPrivateKey', async function () {
        const { provider } = await loadFixture(commonFixture);

        const signer = ProxySigner.fromPrivateKey(TEST_PRIVATEKEY, provider);

        expect(signer.address).to.equal(TEST_ADDRESS);
    });

    it('Send max value on Hardhat', async function () {
        {
            const { provider, owner, bob } = await loadFixture(commonFixture);

            const value = await provider.getBalance(owner.address);

            const tx = (await owner.sendTransaction({
                to: bob.address,
                value,
            })) as TransactionRequestWithFees;

            expect(tx.value).to.be.lessThan(value);
            // estimateGas for hardhat on EOA doesn't return 21000n I guess
            //expect(tx.gasLimit).to.equal(21000n);
            expect(tx.gasLimit).to.be.lessThan(30000n);
            // hardhat refills balance when low so we just assume here
            expect(BigInt(tx.value || 0n)).to.be.lessThan(value);
            expect(value - BigInt(tx.value || 0n)).to.be.lessThanOrEqual(tx.txCost);
        }

        {
            const { provider, owner, weth } = await loadFixture(commonFixture);

            const value = await provider.getBalance(owner.address);

            const tx2 = (await owner.sendTransaction({
                to: weth.target as string,
                value,
            })) as TransactionRequestWithFees;

            expect(tx2.value).to.be.lessThan(value);
            expect(tx2.gasLimit).to.be.lessThan(100000n);
            // hardhat refills balance when low so we just assume here
            expect(BigInt(tx2.value || 0n)).to.be.lessThan(value);
            expect(value - BigInt(tx2.value || 0n)).to.be.lessThanOrEqual(tx2.txCost);
        }
    });

    it('Populate max value on Hardhat', async function () {
        const { provider, owner, weth } = await loadFixture(commonFixture);

        const value = await provider.getBalance(owner.address);

        const tx = await owner.populateTransaction({
            to: ZeroAddress,
            value,
        });

        expect(tx.value).to.be.lessThan(value);
        // estimateGas for hardhat on EOA doesn't return 21000n I guess
        //expect(tx.gasLimit).to.equal(21000n);
        expect(tx.gasLimit).to.be.lessThan(30000n);

        const tx2 = await owner.populateTransaction({
            to: weth.target as string,
            value,
        });

        expect(tx2.value).to.be.lessThan(value);
        expect(tx2.gasLimit).to.be.lessThan(100000n);
    });

    it('Populate max value on ETH', async function () {
        const { provider, signer, chainId, weth } = await loadFixture(ethFixture);

        const value = await provider.getBalance(signer.address);

        const tx = (await signer.populateTransaction({
            to: ZeroAddress,
            value,
        })) as TransactionRequestWithFees;

        const txCostEOA = Number(formatEther(tx.txCost as bigint)) * ethUsd;

        console.log(`${chainId} cost: $${Number(txCostEOA.toFixed(8))}`);

        expect(tx.nonce).to.be.a('number');
        expect(tx.value).to.be.lessThan(value);
        expect(tx.gasLimit).to.equal(21000n);

        const tx2 = await signer.populateTransaction({
            to: weth.target as string,
            value,
        });

        expect(tx2.nonce).to.be.a('number');
        expect(tx2.value).to.be.lessThan(value);
        expect(tx2.gasLimit).to.be.lessThan(100000n);
    });

    it('Populate max value on BNB', async function () {
        const { provider, signer, chainId, wbnb } = await loadFixture(bnbFixture);

        const value = await provider.getBalance(signer.address);

        const tx = (await signer.populateTransaction({
            to: ZeroAddress,
            value,
        })) as TransactionRequestWithFees;

        const txCostEOA = Number(formatEther(tx.txCost as bigint)) * bnbUsd;

        console.log(`${chainId} cost: $${Number(txCostEOA.toFixed(8))}`);

        expect(tx.value).to.be.lessThan(value);
        expect(tx.gasLimit).to.equal(21000n);

        const tx2 = await signer.populateTransaction({
            to: wbnb.target as string,
            value,
        });

        expect(tx2.value).to.be.lessThan(value);
        expect(tx2.gasLimit).to.be.lessThan(100000n);
    });

    it('Populate max value on BASE', async function () {
        const { provider, signer, chainId, weth } = await loadFixture(baseFixture);

        const value = await provider.getBalance(signer.address);

        const tx = (await signer.populateTransaction({
            to: ZeroAddress,
            value,
        })) as TransactionRequestWithFees;

        const txCostEOA = Number(formatEther(tx.txCost as bigint)) * ethUsd;
        const l1CostEOA = Number(formatEther(tx.l1Fee as bigint)) * ethUsd;

        console.log(
            `${chainId} cost: $${Number(txCostEOA.toFixed(8))} (L1: $${Number(l1CostEOA.toFixed(8))})`,
        );

        expect(tx.value).to.be.lessThan(value);
        expect(tx.gasLimit).to.equal(21000n);
        expect(tx.l1Fee).to.be.greaterThan(1n);

        const tx2 = (await signer.populateTransaction({
            to: weth.target as string,
            value,
        })) as TransactionRequestWithFees;

        expect(tx2.value).to.be.lessThan(value);
        expect(tx2.gasLimit).to.be.lessThan(100000n);
        expect(tx2.l1Fee).to.be.greaterThan(1n);
    });

    it('Populate max value on ARB', async function () {
        const { provider, signer, chainId, weth } = await loadFixture(arbFixture);

        const value = await provider.getBalance(signer.address);

        const tx = (await signer.populateTransaction({
            to: ZeroAddress,
            value,
        })) as TransactionRequestWithFees;

        const txCostEOA = Number(formatEther(tx.txCost as bigint)) * ethUsd;

        console.log(`${chainId} cost: $${Number(txCostEOA.toFixed(8))}`);

        expect(tx.value).to.be.lessThan(value);
        expect(tx.gasLimit).to.gte(21000n);

        const tx2 = await signer.populateTransaction({
            to: weth.target as string,
            value,
        });

        expect(tx2.value).to.be.lessThan(value);
        expect(tx2.gasLimit).to.gte(21000n);
    });
});
