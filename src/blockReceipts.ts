import type {
    BlockTag,
    Network,
    TransactionReceipt,
    TransactionReceiptParams,
    Provider,
    JsonRpcApiProvider,
} from 'ethers';

/**
 * Fetches all transaction receipts for a specific block.
 * @param provider The ethers Provider.
 * @param blockTag Block number, tag, or hash.
 * @param network Optional network override.
 * @returns Promise resolving to the array of TransactionReceipts for the block.
 */
export async function getBlockReceipts(
    provider: Provider,
    blockTag?: BlockTag,
    network?: Network,
): Promise<TransactionReceipt[]> {
    const _provider = provider as JsonRpcApiProvider;
    const _network = network || (await provider.getNetwork());

    const parsedBlock = blockTag ? _provider._getBlockTag(blockTag) : 'latest';

    const blockReceipts = (await _provider.send('eth_getBlockReceipts', [parsedBlock])) as
        | TransactionReceiptParams[]
        | null;

    if (!blockReceipts) {
        throw new Error(`No block receipts for ${blockTag}`);
    }

    return blockReceipts.map((r) => _provider._wrapTransactionReceipt(r, _network));
}
