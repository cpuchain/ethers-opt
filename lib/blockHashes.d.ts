import type { Provider } from 'ethers';
import { Multicall } from './typechain';
/**
 * Compare last 80 blocks to find reorgs
 */
export interface BlockHash {
    number: number;
    hash?: string;
}
/**
 * Fetches recent block hashes, using multicall when possible for efficiency.
 * @param provider The provider (optionally with multicall).
 * @param knownBlock Optional: block to start from (defaults to latest).
 * @param depth Optional: how many blocks to look back (default 80).
 * @returns Array of BlockHash {number, hash}.
 */
export declare function fetchBlockHashes(provider: Provider & {
    multicall?: Multicall;
}, knownBlock?: number, depth?: number): Promise<BlockHash[]>;
/**
 * Returns the first block number where the hashes from two sources disagree (detects reorgs).
 * @param fromLocal Locally cached block hashes.
 * @param fromNode Current chain block hashes.
 * @returns The reorged block number, or undefined if chains match.
 */
export declare function compareBlockHashes(fromLocal: BlockHash[], fromNode: BlockHash[]): number | undefined;
