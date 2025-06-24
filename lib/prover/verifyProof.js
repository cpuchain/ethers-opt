"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyStorageProof = verifyStorageProof;
exports.verifyERC20Proof = verifyERC20Proof;
exports.verifyChainlinkProof = verifyChainlinkProof;
const mpt_1 = require("@ethereumjs/mpt");
const rlp_1 = require("@ethereumjs/rlp");
const ethers_1 = require("ethers");
const proof_1 = require("../proof");
const utils_1 = require("../utils");
const price_1 = require("../price");
/**
 * Verifies the storage proof for a given contract's storage at a state root.
 * @param contractAddress Address of the contract to verify.
 * @param storageKey Storage slot to verify (hex string).
 * @param stateRoot The block state root.
 * @param proof The EIP-1186 proof object.
 * @returns Promise resolving to the storage root as a hex string on success, or throws on failure.
 */
async function verifyStorageProof(contractAddress, storageKey, stateRoot, proof) {
    const storageProof = proof.storageProof[0];
    const storageProofValue = (0, utils_1.toEvenHex)(storageProof.value);
    // 2. Verify account proof
    const accountRLP = await (0, mpt_1.verifyMerkleProof)((0, ethers_1.getBytes)(contractAddress), proof.accountProof.map((n) => (0, ethers_1.getBytes)(n)), {
        useKeyHashing: true,
        root: (0, ethers_1.getBytes)(stateRoot),
    });
    if (!accountRLP) {
        throw new Error('Account does not exist in state trie');
    }
    // accountRLP = RLP([nonce, balance, storageRoot, codeHash])
    const storageRoot = rlp_1.RLP.decode(accountRLP)[2];
    // 3. Verify storage proof
    const storageRLP = await (0, mpt_1.verifyMerkleProof)((0, ethers_1.getBytes)(storageKey), storageProof.proof.map((n) => (0, ethers_1.getBytes)(n)), {
        useKeyHashing: true,
        root: storageRoot,
    });
    if (!storageRLP) {
        throw new Error('Storage does not exist in state trie');
    }
    const decodedValue = (0, ethers_1.hexlify)(rlp_1.RLP.decode(storageRLP));
    if (decodedValue === storageProofValue) {
        return (0, ethers_1.hexlify)(storageRoot);
    }
}
const abiEncoder = ethers_1.AbiCoder.defaultAbiCoder();
/**
 * Verifies an ERC20 token balance proof at a specific block number.
 * @param erc20 ERC20 contract instance.
 * @param tokenBalanceSlot Storage slot for the token balance mapping.
 * @param owner Owner address or signer (whose balance is to be verified).
 * @param balance Optional expected balance (will auto-fetch if not given).
 * @param blockNumber Block number to verify at (current block if not specified).
 * @returns Resolves to proof data including tokenBalance, or throws if invalid.
 */
async function verifyERC20Proof(erc20, tokenBalanceSlot, owner, balance, blockNumber) {
    const token = erc20;
    const provider = (token.runner?.provider || token.runner);
    const ownerAddress = owner?.address ||
        owner ||
        token.runner?.address;
    if (!blockNumber) {
        blockNumber = await provider.getBlockNumber();
    }
    const storageKey = typeof tokenBalanceSlot === 'number'
        ? (0, ethers_1.keccak256)(abiEncoder.encode(['address', 'uint256'], [ownerAddress, tokenBalanceSlot]))
        : tokenBalanceSlot;
    const [tokenBalance, block, proof] = await Promise.all([
        balance ?? token.balanceOf(ownerAddress),
        provider.getBlock(blockNumber),
        (0, proof_1.getProof)(provider, token.target, storageKey, blockNumber),
    ]);
    const { number, stateRoot, hash } = block || {};
    const storageProof = proof.storageProof[0];
    const storageProofValue = BigInt(storageProof.value);
    if (tokenBalance !== storageProofValue) {
        throw new Error(`Invalid storage value, wants ${tokenBalance} have ${storageProofValue}`);
    }
    const storageRoot = await verifyStorageProof(token.target, storageKey, stateRoot, proof);
    if (storageRoot) {
        return {
            number: number,
            hash: hash,
            stateRoot: stateRoot,
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
async function verifyChainlinkProof(_oracle, oracleSlot, aggregator, expectedAnswers, blockNumber) {
    const oracle = _oracle;
    const provider = (oracle.runner?.provider || oracle.runner);
    const [_blockNumber, _aggregator, roundData] = await Promise.all([
        blockNumber || provider.getBlockNumber(),
        aggregator || oracle.aggregator(),
        expectedAnswers || oracle.latestRoundData(),
    ]);
    const aggregatorRoundId = (0, price_1.getAggregatorRoundId)(roundData.roundId);
    const storageKey = typeof oracleSlot === 'number'
        ? (0, ethers_1.keccak256)(abiEncoder.encode(['uint32', 'uint256'], [aggregatorRoundId, oracleSlot]))
        : oracleSlot;
    const [block, proof] = await Promise.all([
        provider.getBlock(_blockNumber),
        (0, proof_1.getProof)(provider, _aggregator, storageKey, _blockNumber),
    ]);
    const { number, stateRoot, hash } = block || {};
    const transmissionsBytes = (0, ethers_1.getBytes)(proof.storageProof[0].value);
    const answer = (0, ethers_1.toBigInt)(transmissionsBytes.slice(8, 32));
    const startedAt = (0, ethers_1.toNumber)(transmissionsBytes.slice(4, 8));
    const updatedAt = (0, ethers_1.toNumber)(transmissionsBytes.slice(0, 4));
    if (answer !== roundData.answer ||
        startedAt !== Number(roundData.startedAt) ||
        updatedAt !== Number(roundData.updatedAt)) {
        throw new Error(`Unexpected answer, wants ${JSON.stringify(roundData)} have ${JSON.stringify([answer, startedAt, updatedAt])}`);
    }
    const storageRoot = await verifyStorageProof(_aggregator, storageKey, stateRoot, proof);
    if (storageRoot) {
        return {
            number: number,
            hash: hash,
            aggregator: _aggregator,
            stateRoot: stateRoot,
            storageKey,
            storageRoot,
            roundData: {
                roundId: roundData.roundId,
                aggregatorRoundId,
                answer: roundData.answer,
                startedAt: Number(roundData.startedAt),
                updatedAt: Number(roundData.updatedAt),
            },
            proof,
        };
    }
}
