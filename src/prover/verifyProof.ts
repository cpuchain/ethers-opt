import { verifyMerkleProof } from '@ethereumjs/mpt';
import { RLP } from '@ethereumjs/rlp';
import { Provider, keccak256, getBytes, toBigInt, AbiCoder, toNumber, hexlify } from 'ethers';
import { DataFeed, ERC20 } from '../typechain/index.js';
import { EIP1186Proof, getProof } from '../proof.js';
import { SignerWithAddress } from '../signer.js';
import { toEvenHex } from '../utils.js';
import { getAggregatorRoundId, RoundData } from '../price.js';

/**
 * Verifies the storage proof for a given contract's storage at a state root.
 * @param contractAddress Address of the contract to verify.
 * @param storageKey Storage slot to verify (hex string).
 * @param stateRoot The block state root.
 * @param proof The EIP-1186 proof object.
 * @returns Promise resolving to the storage root as a hex string on success, or throws on failure.
 */
export async function verifyStorageProof(
    contractAddress: string,
    storageKey: string,
    stateRoot: string,
    proof: EIP1186Proof,
) {
    const storageProof = proof.storageProof[0];
    const storageProofValue = toEvenHex(storageProof.value);

    // 2. Verify account proof
    const accountRLP = await verifyMerkleProof(
        getBytes(contractAddress),
        proof.accountProof.map((n) => getBytes(n)),
        {
            useKeyHashing: true,
            root: getBytes(stateRoot),
        },
    );

    if (!accountRLP) {
        throw new Error('Account does not exist in state trie');
    }

    // accountRLP = RLP([nonce, balance, storageRoot, codeHash])
    const storageRoot = RLP.decode(accountRLP)[2] as Uint8Array;

    // 3. Verify storage proof
    const storageRLP = await verifyMerkleProof(
        getBytes(storageKey),
        storageProof.proof.map((n) => getBytes(n)),
        {
            useKeyHashing: true,
            root: storageRoot,
        },
    );

    if (!storageRLP) {
        throw new Error('Storage does not exist in state trie');
    }

    const decodedValue = hexlify(RLP.decode(storageRLP as Uint8Array) as Uint8Array);

    if (decodedValue === storageProofValue) {
        return hexlify(storageRoot);
    }
}

const abiEncoder = AbiCoder.defaultAbiCoder();

/**
 * Included: Info about an individual storage/account proof.
 */
export interface ProofData {
    number: number;
    hash: string;
    stateRoot: string;
    storageKey: string;
    storageRoot: string;
    proof: EIP1186Proof;
}

/**
 * Verifies an ERC20 token balance proof at a specific block number.
 * @param erc20 ERC20 contract instance.
 * @param tokenBalanceSlot Storage slot for the token balance mapping.
 * @param owner Owner address or signer (whose balance is to be verified).
 * @param balance Optional expected balance (will auto-fetch if not given).
 * @param blockNumber Block number to verify at (current block if not specified).
 * @returns Resolves to proof data including tokenBalance, or throws if invalid.
 */
export async function verifyERC20Proof(
    erc20: unknown,
    tokenBalanceSlot: number | string,
    owner?: SignerWithAddress | string,
    balance?: bigint,
    blockNumber?: number,
): Promise<(ProofData & { tokenBalance: bigint }) | undefined> {
    const token = erc20 as ERC20;
    const provider = (token.runner?.provider || token.runner) as Provider;
    const ownerAddress =
        (owner as SignerWithAddress)?.address ||
        (owner as string) ||
        (token.runner as SignerWithAddress)?.address;

    if (!blockNumber) {
        blockNumber = await provider.getBlockNumber();
    }

    const storageKey =
        typeof tokenBalanceSlot === 'number'
            ? keccak256(abiEncoder.encode(['address', 'uint256'], [ownerAddress, tokenBalanceSlot]))
            : tokenBalanceSlot;

    const [tokenBalance, block, proof] = await Promise.all([
        balance ?? token.balanceOf(ownerAddress),
        provider.getBlock(blockNumber),
        getProof(provider, token.target as string, storageKey, blockNumber),
    ]);

    const { number, stateRoot, hash } = block || {};

    const storageProof = proof.storageProof[0];
    const storageProofValue = BigInt(storageProof.value);

    if (tokenBalance !== storageProofValue) {
        throw new Error(`Invalid storage value, wants ${tokenBalance} have ${storageProofValue}`);
    }

    const storageRoot = await verifyStorageProof(
        token.target as string,
        storageKey,
        stateRoot as string,
        proof,
    );

    if (storageRoot) {
        return {
            number: number as number,
            hash: hash as string,
            stateRoot: stateRoot as string,
            storageKey,
            storageRoot,
            tokenBalance,
            proof,
        };
    }
}

/**
 * Verifies proof for a Chainlink price feed (round data) at a given block.
 * @param _oracle DataFeed oracle contract instance.
 * @param oracleSlot Proof slot index for Chainlink transmission mapping.
 * @param aggregator (Optional) Oracle aggregator address.
 * @param expectedAnswers (Optional) Expected round data to check.
 * @param blockNumber (Optional) Block number to verify.
 * @returns Resolves to proof data and round info, or throws if invalid.
 */
export async function verifyChainlinkProof(
    _oracle: unknown,
    oracleSlot: number | string,
    aggregator?: string,
    expectedAnswers?: RoundData,
    blockNumber?: number,
): Promise<(ProofData & { aggregator: string; roundData: RoundData }) | undefined> {
    const oracle = _oracle as DataFeed;
    const provider = (oracle.runner?.provider || oracle.runner) as Provider;

    const [_blockNumber, _aggregator, roundData] = await Promise.all([
        blockNumber || provider.getBlockNumber(),
        aggregator || oracle.aggregator(),
        expectedAnswers || oracle.latestRoundData(),
    ]);

    const aggregatorRoundId = getAggregatorRoundId(roundData.roundId);

    const storageKey =
        typeof oracleSlot === 'number'
            ? keccak256(abiEncoder.encode(['uint32', 'uint256'], [aggregatorRoundId, oracleSlot]))
            : oracleSlot;

    const [block, proof] = await Promise.all([
        provider.getBlock(_blockNumber),
        getProof(provider, _aggregator, storageKey, _blockNumber),
    ]);

    const { number, stateRoot, hash } = block || {};

    const transmissionsBytes = getBytes(proof.storageProof[0].value);

    const answer = toBigInt(transmissionsBytes.slice(8, 32));
    const startedAt = toNumber(transmissionsBytes.slice(4, 8));
    const updatedAt = toNumber(transmissionsBytes.slice(0, 4));

    if (
        answer !== roundData.answer ||
        startedAt !== Number(roundData.startedAt) ||
        updatedAt !== Number(roundData.updatedAt)
    ) {
        throw new Error(
            `Unexpected answer, wants ${JSON.stringify(roundData)} have ${JSON.stringify([answer, startedAt, updatedAt])}`,
        );
    }

    const storageRoot = await verifyStorageProof(_aggregator, storageKey, stateRoot as string, proof);

    if (storageRoot) {
        return {
            number: number as number,
            hash: hash as string,
            aggregator: _aggregator,
            stateRoot: stateRoot as string,
            storageKey,
            storageRoot,
            roundData: {
                roundId: roundData.roundId,
                aggregatorRoundId,
                answer: roundData.answer,
                startedAt: Number(roundData.startedAt),
                updatedAt: Number(roundData.updatedAt),
            } as RoundData,
            proof,
        };
    }
}
