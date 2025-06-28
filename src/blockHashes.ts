import type { Provider } from 'ethers';
import { Multicall, Multicall__factory } from './typechain/index.js';
import { MULTICALL_ADDRESS } from './multicall.js';
import { range } from './utils.js';

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
export async function fetchBlockHashes(
    provider: Provider & { multicall?: Multicall },
    knownBlock?: number,
    // Think that 80 is better to detect reorgs
    // https://www.reddit.com/r/0xPolygon/comments/10bvruq/polygons_block_reorg_problem_daily_10_depth_reorgs
    depth = 80,
): Promise<BlockHash[]> {
    const multicall = provider.multicall || Multicall__factory.connect(MULTICALL_ADDRESS, provider);

    const head = await provider.getBlockNumber();

    if (!knownBlock) {
        knownBlock = head;
    }

    const blocks = await Promise.all(
        range(knownBlock + 1 - depth, knownBlock).map(async (number) => {
            // If it is unable to fetch using multicall
            const outsideState = number + 100 <= head;

            if (!outsideState) {
                try {
                    const hash = await multicall.getBlockHash(number);

                    return { number, hash };

                    // eslint-disable-next-line no-empty
                } catch {}
            }

            const { hash } = (await provider.getBlock(number)) || {};

            if (!hash) {
                throw new Error(`Block hash ${number} not available`);
            }

            return { number, hash };
        }),
    );

    return blocks;
}

/**
 * Returns the first block number where the hashes from two sources disagree (detects reorgs).
 * @param fromLocal Locally cached block hashes.
 * @param fromNode Current chain block hashes.
 * @returns The reorged block number, or undefined if chains match.
 */
export function compareBlockHashes(fromLocal: BlockHash[], fromNode: BlockHash[]): number | undefined {
    fromLocal = fromLocal.sort((a, b) => a.number - b.number);

    for (const localBlock of fromLocal) {
        const nodeBlock = fromNode.find((a) => a.number === localBlock.number);

        if (!nodeBlock?.hash) {
            continue;
        }

        if (nodeBlock.hash !== localBlock.hash) {
            return localBlock.number;
        }
    }
}
