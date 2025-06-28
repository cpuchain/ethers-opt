import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { describe, beforeAll, expect, it } from 'vitest';
import { formatUnits } from 'ethers';
import { getSigners } from '../src/hardhat/fixtures/index.js';
import { getGasPrice, MULTICALL_ADDRESS, Provider, ProxySigner } from '../src/index.js';

const ETH_RPC = 'https://rpc.mevblocker.io';
const BNB_RPC = 'https://bsc-dataseed.bnbchain.org';
const BASE_RPC = 'https://mainnet.base.org';
const ARB_RPC = 'https://arb1.arbitrum.io/rpc';

describe('provider.ts', function () {
    let vitalikAddress: string;

    const commonFixture = async () => {
        const [owner] = await getSigners();

        return { owner, provider: owner.provider as Provider };
    };

    const ethFixture = async () => {
        const provider = new Provider(ETH_RPC);
        const signer = ProxySigner.fromAddress(vitalikAddress, provider);

        return { provider, signer };
    };

    const bnbFixture = async () => {
        const provider = new Provider(BNB_RPC);
        const signer = ProxySigner.fromAddress(vitalikAddress, provider);

        return { provider, signer };
    };

    const baseFixture = async () => {
        const provider = new Provider(BASE_RPC);
        const signer = ProxySigner.fromAddress(vitalikAddress, provider);

        return { provider, signer };
    };

    const arbFixture = async () => {
        const provider = new Provider(ARB_RPC);
        const signer = ProxySigner.fromAddress(vitalikAddress, provider);

        return { provider, signer };
    };

    beforeAll(async function () {
        const provider = new Provider(ETH_RPC);

        vitalikAddress = (await provider.resolveName('vitalik.eth')) as string;

        if (!vitalikAddress) {
            throw new Error('Invalid vitalik.eth address');
        }
    });

    it('getFeeData (hardhat)', async function () {
        const { provider } = await loadFixture(commonFixture);

        const feeData = await provider.getFeeData();

        const gasPrice = getGasPrice(feeData);

        console.log(`Hardhat Gas: ${Number(formatUnits(gasPrice, 'gwei')).toFixed(5)} gwei`);

        expect(feeData.maxFeePerGas).to.gte(1n);
        expect(feeData.maxPriorityFeePerGas).to.gte(1n);
        expect(feeData.gasPrice).to.gte(1n);

        expect(gasPrice).to.gte(1n);
    });

    it('getFeeData (ETH mainnet)', async function () {
        const { provider } = await loadFixture(ethFixture);

        const feeData = await provider.getFeeData();

        const gasPrice = getGasPrice(feeData);

        console.log(`ETH Gas: ${Number(formatUnits(gasPrice, 'gwei')).toFixed(5)} gwei`);

        expect(feeData.maxFeePerGas).to.gte(1n);
        expect(feeData.maxPriorityFeePerGas).to.gte(1n);
        expect(feeData.gasPrice).to.gte(1n);

        expect(gasPrice).to.gte(1n);
    });

    it('getFeeData (BNB chain mainnet)', async function () {
        const { provider } = await loadFixture(bnbFixture);

        const feeData = await provider.getFeeData();

        const gasPrice = getGasPrice(feeData);

        console.log(`BNB Gas: ${Number(formatUnits(gasPrice, 'gwei')).toFixed(5)} gwei`);

        expect(feeData.gasPrice).to.gte(1n);
        expect(gasPrice).to.gte(1n);
    });

    it('getFeeData (BASE chain)', async function () {
        const { provider } = await loadFixture(baseFixture);

        const feeData = await provider.getFeeData();

        const gasPrice = getGasPrice(feeData);

        console.log(`Base Gas: ${Number(formatUnits(gasPrice, 'gwei')).toFixed(5)} gwei`);

        expect(feeData.gasPrice).to.gte(1n);
        expect(gasPrice).to.gte(1n);
    });

    it('getFeeData (Arbitrum chain)', async function () {
        const { provider } = await loadFixture(arbFixture);

        const feeData = await provider.getFeeData();

        const gasPrice = getGasPrice(feeData);

        console.log(`Arb Gas: ${Number(formatUnits(gasPrice, 'gwei')).toFixed(5)} gwei`);

        expect(feeData.gasPrice).to.gte(1n);
        expect(gasPrice).to.gte(1n);
    });

    it('getResolver returns EnsResolver for vitalik.eth', async function () {
        const { provider, signer } = await loadFixture(ethFixture);

        const res = await provider.getResolver('vitalik.eth');
        const addr = await res?.getAddress();

        expect(res).to.not.be.null;
        expect(addr).to.equal(signer.address);
    });

    it('lookupAddress finds ENS name for vitalik address', async function () {
        const { provider, signer } = await loadFixture(ethFixture);

        const name = await provider.lookupAddress(signer.address);

        expect(name).to.eq('vitalik.eth');
    });

    it('wait works on hardhat', async function () {
        const { provider, owner } = await loadFixture(commonFixture);

        const tx = await owner.sendTransaction({ to: owner.address, value: 1n });

        const receipt = await provider.wait(tx);

        expect(receipt).to.not.be.null;
        expect(receipt?.blockNumber).to.not.be.null;
    });

    it('hasCode works on hardhat', async function () {
        const { provider } = await loadFixture(commonFixture);

        expect(await provider.hasCode(MULTICALL_ADDRESS)).to.be.true;
    });

    it('getBlockReceipts returns receipts for ETH mainnet', async function () {
        const { provider } = await loadFixture(ethFixture);

        const blockReceipts = await provider.getBlockReceipts();

        expect(blockReceipts).to.be.an('array');
        expect(blockReceipts[0]?.hash).to.be.an('string');
    });
});
