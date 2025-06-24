import type { BlockTag, Network, TransactionReceipt, Provider } from 'ethers';
/**
 * Fetches all transaction receipts for a specific block.
 * @param provider The ethers Provider.
 * @param blockTag Block number, tag, or hash.
 * @param network Optional network override.
 * @returns Promise resolving to the array of TransactionReceipts for the block.
 */
export declare function getBlockReceipts(provider: Provider, blockTag?: BlockTag, network?: Network): Promise<TransactionReceipt[]>;
