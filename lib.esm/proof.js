"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProof = getProof;
exports.getStorageAt = getStorageAt;
const ethers_1 = require("./ethers");
const { toQuantity } = ethers_1.ethers;
/**
 * Fetches a merkle proof for a given contract and storage slot at a block.
 * @param provider The JSON-RPC API provider.
 * @param contractAddress The contract to prove.
 * @param storageKeys A single or array of storage slot keys.
 * @param blockTag Optional block number/tag.
 * @returns Promise resolving to the EIP-1186 proof.
 */
async function getProof(provider, contractAddress, storageKeys, blockTag) {
    const _provider = provider;
    const storageKey = typeof storageKeys === 'string' ? [storageKeys] : storageKeys;
    return _provider.send('eth_getProof', [
        contractAddress,
        storageKey,
        blockTag ? _provider._getBlockTag(blockTag) : 'latest',
    ]);
}
/**
 * Fetches the value of a specific storage slot for a contract at a block.
 * @param provider The JSON-RPC provider.
 * @param contract The contract address.
 * @param storageKey Numeric or string slot.
 * @param blockTag Optional block tag.
 * @returns The value at that storage key (as a hex string).
 */
async function getStorageAt(provider, contract, storageKey, blockTag) {
    const _provider = provider;
    return _provider.send('eth_getStorageAt', [
        contract,
        toQuantity(storageKey),
        blockTag ? _provider._getBlockTag(blockTag) : 'latest',
    ]);
}
