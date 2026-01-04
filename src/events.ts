import {
    BaseContract,
    ContractEventName,
    BlockTag,
    Provider,
    TopicFilter,
    EventFragment,
    assert,
    EventLog,
    UndecodedEventLog,
    Log,
} from 'ethers';
import { getSubInfo } from './ethers.js';

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
export async function multiQueryFilter({
    address,
    provider,
    contract,
    event,
    fromBlock,
    toBlock,
}: {
    address?: string | string[];
    provider?: Provider;
    contract?: BaseContract;
    event?: ContractEventName;
    fromBlock?: BlockTag;
    toBlock?: BlockTag;
}) {
    if (!address && contract) {
        address = contract.target as string;
    } else if (address === '*') {
        address = undefined;
    }
    if (!provider && contract) {
        provider = (contract.runner?.provider || contract.runner) as Provider;
    }
    if (!event) {
        event = '*';
    }
    if (!fromBlock && fromBlock !== 0) {
        fromBlock = 0;
    }
    if (!toBlock && toBlock !== 0) {
        toBlock = 'latest';
    }

    let fragment: EventFragment | null = null,
        topics: TopicFilter | null[] = [null];

    if (contract) {
        ({ fragment, topics } = await getSubInfo(contract.interface, event));
    }

    const filter = {
        address,
        topics,
        fromBlock,
        toBlock,
    };

    assert(provider, 'contract runner does not have a provider', 'UNSUPPORTED_OPERATION', {
        operation: 'queryFilter',
    });

    return (await provider.getLogs(filter)).map((log) => {
        let foundFragment = fragment;
        if (foundFragment == null && contract) {
            try {
                foundFragment = contract.interface.getEvent(log.topics[0]);
                // eslint-disable-next-line no-empty
            } catch {}
        }

        if (foundFragment && contract) {
            try {
                return new EventLog(log, contract.interface, foundFragment);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (error: any) {
                return new UndecodedEventLog(log, error);
            }
        }

        return new Log(log, provider);
    });
}
