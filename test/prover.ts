import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { beforeAll, describe, expect, it } from 'vitest';
import { AbiCoder, keccak256 } from 'ethers';
import { ERC20__factory, Provider, EthersBatcher, getAggregatorRoundId, getChainlink } from '../src/index.js';
import { verifyChainlinkProof, verifyERC20Proof } from '../src/prover/index.js';

const RPS = 10;
const BATCH_SIZE = 2;

const ETH_RPC = 'https://ethereum.keydonix.com/v1/mainnet';
const USDT_ADDRESS = '0xdAC17F958D2ee523a2206206994597C13D831ec7';

const abiEncoder = AbiCoder.defaultAbiCoder();

describe('prover.ts', function () {
    let vitalikAddress: string;

    const commonFixture = async () => {
        const provider = new Provider(ETH_RPC);

        const usdt = ERC20__factory.connect(USDT_ADDRESS, provider);

        const batcher = new EthersBatcher({
            ratePerSecond: RPS,
            batchSize: BATCH_SIZE,
        });

        return { provider, usdt, batcher };
    };

    beforeAll(async function () {
        const provider = new Provider(ETH_RPC);

        vitalikAddress = (await provider.resolveName('vitalik.eth')) as string;

        if (!vitalikAddress) {
            throw new Error('Invalid vitalik.eth address');
        }
    });

    it('verifyERC20Proof', async function () {
        const { provider, usdt, batcher } = await loadFixture(commonFixture);

        const vitalikBalance = await usdt.balanceOf(vitalikAddress);

        const { storageSlot } =
            (await batcher.findStorageKey(provider, usdt.target as string, (index: number) =>
                keccak256(abiEncoder.encode(['address', 'uint256'], [vitalikAddress, index])),
            )) || {};

        const verifiedProof = await verifyERC20Proof(
            usdt,
            storageSlot as number,
            vitalikAddress,
            vitalikBalance,
        );

        expect(verifiedProof).to.be.not.undefined;
        expect(verifiedProof?.hash).to.be.a('string');
        expect(verifiedProof?.number).to.be.a('number');
        expect(verifiedProof?.stateRoot).to.be.a('string');
        expect(verifiedProof?.storageKey).to.be.a('string');
        expect(verifiedProof?.storageRoot).to.be.a('string');
        expect(verifiedProof?.proof?.nonce).to.be.a('string');
    });

    it('verifyChainlinkProof', async function () {
        const { provider, batcher } = await loadFixture(commonFixture);

        const oracle = await getChainlink(provider, 'SOL');

        const [_aggregator, _roundId] = await Promise.all([oracle.aggregator(), oracle.latestRound()]);

        const aggregatorRoundId = getAggregatorRoundId(_roundId);

        const { storageSlot } =
            (await batcher.findStorageKey(provider, _aggregator, (index: number) =>
                keccak256(abiEncoder.encode(['uint32', 'uint256'], [aggregatorRoundId, index])),
            )) || {};

        const verifiedProof = await verifyChainlinkProof(oracle, storageSlot as number, _aggregator);

        expect(verifiedProof).to.be.not.undefined;
        expect(verifiedProof?.hash).to.be.a('string');
        expect(verifiedProof?.number).to.be.a('number');
        expect(verifiedProof?.stateRoot).to.be.a('string');
        expect(verifiedProof?.storageKey).to.be.a('string');
        expect(verifiedProof?.storageRoot).to.be.a('string');
        expect(verifiedProof?.proof?.nonce).to.be.a('string');
    });
});
