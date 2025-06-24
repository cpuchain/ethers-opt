import type { BlockTag, Provider } from 'ethers';
/**
 * Describes a single storage proof entry for EIP-1186.
 */
export interface StorageProof {
    key: string;
    value: string;
    proof: string[];
}
/**
 * EIP-1186 proof structure for account and storage.
 */
export interface EIP1186Proof {
    address?: string;
    accountProof: string[];
    balance: string;
    codeHash: string;
    nonce: string;
    storageRoot: string;
    storageHash: string;
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
export declare function getProof(provider: Provider, contractAddress: string, storageKeys: string | string[], blockTag?: BlockTag): Promise<EIP1186Proof>;
/**
 * Fetches the value of a specific storage slot for a contract at a block.
 * @param provider The JSON-RPC provider.
 * @param contract The contract address.
 * @param storageKey Numeric or string slot.
 * @param blockTag Optional block tag.
 * @returns The value at that storage key (as a hex string).
 */
export declare function getStorageAt(provider: Provider, contract: string, storageKey: string | number, blockTag?: BlockTag): Promise<string>;
