"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getBlockReceipts = getBlockReceipts;
/**
 * Fetches all transaction receipts for a specific block.
 * @param provider The ethers Provider.
 * @param blockTag Block number, tag, or hash.
 * @param network Optional network override.
 * @returns Promise resolving to the array of TransactionReceipts for the block.
 */
async function getBlockReceipts(provider, blockTag, network) {
    const _provider = provider;
    const _network = network || (await provider.getNetwork());
    const parsedBlock = blockTag ? _provider._getBlockTag(blockTag) : 'latest';
    const blockReceipts = (await _provider.send('eth_getBlockReceipts', [parsedBlock]));
    if (!blockReceipts) {
        throw new Error(`No block receipts for ${blockTag}`);
    }
    return blockReceipts.map((r) => _provider._wrapTransactionReceipt(r, _network));
}
