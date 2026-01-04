'use strict';

var mpt = require('@ethereumjs/mpt');
var rlp = require('@ethereumjs/rlp');
var ethers = require('ethers');
require('crypto');

async function getProof(provider, contractAddress, storageKeys, blockTag) {
  const _provider = provider;
  const storageKey = typeof storageKeys === "string" ? [storageKeys] : storageKeys;
  return _provider.send("eth_getProof", [
    contractAddress,
    storageKey,
    blockTag ? _provider._getBlockTag(blockTag) : "latest"
  ]);
}

if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function() {
    return this.toString();
  };
}
!process?.browser && typeof globalThis.window === "undefined";
function toEvenHex(hexStr) {
  if (hexStr.startsWith("0x")) {
    hexStr = hexStr.slice(2);
  }
  if (hexStr.length % 2 !== 0) {
    hexStr = "0" + hexStr;
  }
  return "0x" + hexStr;
}

const PHASE_OFFSET = 64;
function getAggregatorRoundId(roundId) {
  return Number(BigInt(roundId) & (BigInt(1) << BigInt(PHASE_OFFSET)) - BigInt(1));
}

async function verifyStorageProof(contractAddress, storageKey, stateRoot, proof) {
  const storageProof = proof.storageProof[0];
  const storageProofValue = toEvenHex(storageProof.value);
  const accountRLP = await mpt.verifyMerkleProof(
    ethers.getBytes(contractAddress),
    proof.accountProof.map((n) => ethers.getBytes(n)),
    {
      useKeyHashing: true,
      root: ethers.getBytes(stateRoot)
    }
  );
  if (!accountRLP) {
    throw new Error("Account does not exist in state trie");
  }
  const storageRoot = rlp.RLP.decode(accountRLP)[2];
  const storageRLP = await mpt.verifyMerkleProof(
    ethers.getBytes(storageKey),
    storageProof.proof.map((n) => ethers.getBytes(n)),
    {
      useKeyHashing: true,
      root: storageRoot
    }
  );
  if (!storageRLP) {
    throw new Error("Storage does not exist in state trie");
  }
  const decodedValue = ethers.hexlify(rlp.RLP.decode(storageRLP));
  if (decodedValue === storageProofValue) {
    return ethers.hexlify(storageRoot);
  }
}
const abiEncoder = ethers.AbiCoder.defaultAbiCoder();
async function verifyERC20Proof(erc20, tokenBalanceSlot, owner, balance, blockNumber) {
  const token = erc20;
  const provider = token.runner?.provider || token.runner;
  const ownerAddress = owner?.address || owner || token.runner?.address;
  if (!blockNumber) {
    blockNumber = await provider.getBlockNumber();
  }
  const storageKey = typeof tokenBalanceSlot === "number" ? ethers.keccak256(abiEncoder.encode(["address", "uint256"], [ownerAddress, tokenBalanceSlot])) : tokenBalanceSlot;
  const [tokenBalance, block, proof] = await Promise.all([
    balance ?? token.balanceOf(ownerAddress),
    provider.getBlock(blockNumber),
    getProof(provider, token.target, storageKey, blockNumber)
  ]);
  const { number, stateRoot, hash } = block || {};
  const storageProof = proof.storageProof[0];
  const storageProofValue = BigInt(storageProof.value);
  if (tokenBalance !== storageProofValue) {
    throw new Error(`Invalid storage value, wants ${tokenBalance} have ${storageProofValue}`);
  }
  const storageRoot = await verifyStorageProof(
    token.target,
    storageKey,
    stateRoot,
    proof
  );
  if (storageRoot) {
    return {
      number,
      hash,
      stateRoot,
      storageKey,
      storageRoot,
      tokenBalance,
      proof
    };
  }
}
async function verifyChainlinkProof(_oracle, oracleSlot, aggregator, expectedAnswers, blockNumber) {
  const oracle = _oracle;
  const provider = oracle.runner?.provider || oracle.runner;
  const [_blockNumber, _aggregator, roundData] = await Promise.all([
    blockNumber || provider.getBlockNumber(),
    aggregator || oracle.aggregator(),
    expectedAnswers || oracle.latestRoundData()
  ]);
  const aggregatorRoundId = getAggregatorRoundId(roundData.roundId);
  const storageKey = typeof oracleSlot === "number" ? ethers.keccak256(abiEncoder.encode(["uint32", "uint256"], [aggregatorRoundId, oracleSlot])) : oracleSlot;
  const [block, proof] = await Promise.all([
    provider.getBlock(_blockNumber),
    getProof(provider, _aggregator, storageKey, _blockNumber)
  ]);
  const { number, stateRoot, hash } = block || {};
  const transmissionsBytes = ethers.getBytes(proof.storageProof[0].value);
  const answer = ethers.toBigInt(transmissionsBytes.slice(8, 32));
  const startedAt = ethers.toNumber(transmissionsBytes.slice(4, 8));
  const updatedAt = ethers.toNumber(transmissionsBytes.slice(0, 4));
  if (answer !== roundData.answer || startedAt !== Number(roundData.startedAt) || updatedAt !== Number(roundData.updatedAt)) {
    throw new Error(
      `Unexpected answer, wants ${JSON.stringify(roundData)} have ${JSON.stringify([answer, startedAt, updatedAt])}`
    );
  }
  const storageRoot = await verifyStorageProof(_aggregator, storageKey, stateRoot, proof);
  if (storageRoot) {
    return {
      number,
      hash,
      aggregator: _aggregator,
      stateRoot,
      storageKey,
      storageRoot,
      roundData: {
        roundId: roundData.roundId,
        aggregatorRoundId,
        answer: roundData.answer,
        startedAt: Number(roundData.startedAt),
        updatedAt: Number(roundData.updatedAt)
      },
      proof
    };
  }
}

exports.verifyChainlinkProof = verifyChainlinkProof;
exports.verifyERC20Proof = verifyERC20Proof;
exports.verifyStorageProof = verifyStorageProof;
