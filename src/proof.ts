import { BlockTag, JsonRpcApiProvider, Provider, toQuantity } from 'ethers';

/**
 * Describes a single storage proof entry for EIP-1186.
 */
export interface StorageProof {
    key: string; // Hex string key for storage slot, e.g. "0x..."
    value: string; // Hex string value at storage slot, e.g. "0x..."
    proof: string[]; // Array of hex string nodes for the storage proof
}

/**
 * EIP-1186 proof structure for account and storage.
 */
export interface EIP1186Proof {
    address?: string; // Hex string Ethereum account address, e.g. "0x..."
    accountProof: string[]; // Array of hex string nodes for the account proof
    balance: string; // The account balance (hex string, e.g. "0x1")
    codeHash: string; // The keccak256 hash of the account code (hex string)
    nonce: string; // The account nonce (hex string)
    storageRoot: string;
    storageHash: string; // The keccak256 hash of the storage root (hex string)
    storageProof: StorageProof[];
}

/**
 * Fetches a merkle proof for a given contract and storage slot at a block.
 * @param provider The JSON-RPC API provider.
 * @param contractAddress The contract to prove.
 * @param storageKeys A single or array of storage slot keys.
 * @param blockTag Optional block number/tag.
 * @returns Promise resolving to the EIP-1186 proof.
 */
export async function getProof(
    provider: Provider,
    contractAddress: string,
    storageKeys: string | string[],
    blockTag?: BlockTag,
): Promise<EIP1186Proof> {
    const _provider = provider as JsonRpcApiProvider;
    const storageKey = typeof storageKeys === 'string' ? [storageKeys] : storageKeys;

    return _provider.send('eth_getProof', [
        contractAddress,
        storageKey,
        blockTag ? _provider._getBlockTag(blockTag) : 'latest',
    ]) as Promise<EIP1186Proof>;
}

/**
 * Fetches the value of a specific storage slot for a contract at a block.
 * @param provider The JSON-RPC provider.
 * @param contract The contract address.
 * @param storageKey Numeric or string slot.
 * @param blockTag Optional block tag.
 * @returns The value at that storage key (as a hex string).
 */
export async function getStorageAt(
    provider: Provider,
    contract: string,
    storageKey: string | number,
    blockTag?: BlockTag,
) {
    const _provider = provider as JsonRpcApiProvider;

    return _provider.send('eth_getStorageAt', [
        contract,
        toQuantity(storageKey),
        blockTag ? _provider._getBlockTag(blockTag) : 'latest',
    ]) as Promise<string>;
}
