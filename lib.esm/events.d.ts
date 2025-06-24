import type { BaseContract, ContractEventName, BlockTag, Provider } from 'ethers';
/**
 * Queries for event logs (optionally decoded) from provider or contract, in an arbitrary block range.
 * Supports basic topic and address filtering. If `address === '*'` scans the entire blockchain.
 *
 * @param args
 *   - address: Address(es) to filter on (optional).
 *   - provider: Provider to use (optional).
 *   - contract: Contract instance for decoding (optional).
 *   - event: The event signature/name (optional).
 *   - fromBlock: Start of block range (default: 0).
 *   - toBlock: End of block range (default: 'latest').
 * @returns Array of EventLog, UndecodedEventLog, or Log objects.
 */
export declare function multiQueryFilter({ address, provider, contract, event, fromBlock, toBlock, }: {
    address?: string | string[];
    provider?: Provider;
    contract?: BaseContract;
    event?: ContractEventName;
    fromBlock?: BlockTag;
    toBlock?: BlockTag;
}): Promise<import("ethers").Log[]>;
