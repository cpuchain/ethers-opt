"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EthersBatcher = void 0;
exports.createBatchRequest = createBatchRequest;
const utils_1 = require("./utils");
const events_1 = require("./events");
const blockReceipts_1 = require("./blockReceipts");
const traceBlock_1 = require("./traceBlock");
const proof_1 = require("./proof");
/**
 * Runs batch requests concurrently and in chunks for rate-limited APIs.
 * Handles retry and calls outputFunc for each batch.
 * @param params Batch request options.
 * @param type Type name for logging/progress.
 * @param inputs Array of input values.
 * @param outputFunc The async function to call for each input.
 * @returns Array of output results.
 */
async function createBatchRequest(params = {}, type, inputs, outputFunc) {
    const concurrencySize = params.concurrencySize || 10;
    const batchSize = params.batchSize || 10;
    const retryMax = params.retryMax || 2;
    const retryOn = params.retryOn || 500;
    let chunkIndex = 0;
    const results = [];
    for (const chunks of (0, utils_1.chunk)(inputs, concurrencySize * batchSize)) {
        const timeStart = Date.now();
        const chunksResult = (await Promise.all((0, utils_1.chunk)(chunks, batchSize).map(async (_inputs, batchIndex) => {
            // 40ms since default batch requests are collected with 50ms from provider
            await (0, utils_1.sleep)(40 * batchIndex);
            return (async () => {
                let retries = 0;
                let err;
                while (retries <= retryMax) {
                    try {
                        return await Promise.all(_inputs.map((input) => outputFunc(input)));
                    }
                    catch (e) {
                        retries++;
                        err = e;
                        await (0, utils_1.sleep)(retryOn);
                    }
                }
                throw err;
            })();
        }))).flat();
        results.push(...chunksResult);
        chunkIndex += chunks.length;
        if (params.onProgress) {
            params.onProgress({
                type,
                chunkIndex,
                chunkLength: inputs.length,
                chunks,
                chunksResult,
                resultLength: chunksResult.flat().length,
            });
        }
        if (params.delays && Date.now() - timeStart < params.delays) {
            await (0, utils_1.sleep)(params.delays - (Date.now() - timeStart));
        }
    }
    return results;
}
/**
 * Helper class to fetch large amount of blocks / transactions / contract events
 * as quick as possible using batching and concurrent calls
 */
class EthersBatcher {
    ratePerSecond;
    eventRange; // eth_getLogs block range
    concurrencySize;
    batchSize;
    delays;
    reverse;
    retryMax; // Max retry count
    retryOn; // Retry on millisecond
    onProgress;
    /**
     * Helper class to fetch large amounts of blocks, transactions, contract events,
     * and storage using batching and concurrency.
     * @param {EthersBatcherParams} [params] Object with the following optional properties:
     *  - ratePerSecond {number}: Maximum requests per second (default 10)
     *  - eventRange {number}: Default block range for event queries (default 5000)
     *  - concurrencySize {number}: Number of concurrent batch workers (defaults based on ratePerSecond)
     *  - batchSize {number}: Number of requests per sub-batch (defaults based on ratePerSecond)
     *  - delays {number}: Delay interval between batches in ms (default: 1000)
     *  - reverse {boolean}: If true, processes batches in reverse block order
     *  - retryMax {number}: Number of retries for failed batches (default 2)
     *  - retryOn {number}: Milliseconds to wait before retrying (default 500)
     *  - onProgress {BatchOnProgress}: Optional progress callback
     */
    constructor({ ratePerSecond, eventRange, concurrencySize, batchSize: maxBatch, delays: _delays, reverse, retryMax, retryOn, onProgress, } = {}) {
        this.ratePerSecond = ratePerSecond || 10;
        this.eventRange = eventRange || 5000;
        const { concurrency, batchSize, delays } = (0, utils_1.createBatchRateConfig)(this.ratePerSecond, maxBatch, _delays);
        this.concurrencySize = concurrencySize || concurrency;
        this.batchSize = batchSize;
        this.delays = delays;
        this.reverse = reverse ?? false;
        this.retryMax = retryMax || 2;
        this.retryOn = retryOn || 500;
        this.onProgress = onProgress;
    }
    async createBatchRequest(type, inputs, outputFunc) {
        return createBatchRequest(this, type, inputs, outputFunc);
    }
    /**
     * Batch function to fetch multiple blocks in parallel.
     * @param provider RPC provider.
     * @param blockTags List of block numbers or tags.
     * @param prefetchTxs True to also fetch transactions.
     * @returns Array of Block objects.
     */
    async getBlocks(provider, blockTags, prefetchTxs) {
        return await this.createBatchRequest('Blocks', blockTags, async (blockTag) => {
            const block = await provider.getBlock(blockTag, prefetchTxs);
            if (!block) {
                throw new Error(`No block for ${blockTag}`);
            }
            return block;
        });
    }
    /**
     * Fetches transactions by their hashes in batches.
     * @param provider Provider to use.
     * @param txids Array of transaction hashes.
     * @returns Array of TransactionResponse objects.
     */
    async getTransactions(provider, txids) {
        return await this.createBatchRequest('Transactions', txids, async (txid) => {
            const tx = await provider.getTransaction(txid);
            if (!tx) {
                throw new Error(`No tx for ${txid}`);
            }
            return tx;
        });
    }
    /**
     * Fetches multiple transaction receipts concurrently.
     * @param provider Provider to use.
     * @param txids Array of transaction hashes.
     * @returns Array of TransactionReceipt objects.
     */
    async getTransactionReceipts(provider, txids) {
        return await this.createBatchRequest('TransactionReceipts', txids, async (txid) => {
            const tx = await provider.getTransactionReceipt(txid);
            if (!tx) {
                throw new Error(`No tx for ${txid}`);
            }
            return tx;
        });
    }
    /**
     * Fetches receipts for all transactions in specified blocks.
     * @param provider JsonRpcProvider instance.
     * @param blockTags Block tags or numbers.
     * @returns Array of receipts.
     */
    async getBlockReceipts(provider, blockTags) {
        const network = await provider.getNetwork();
        return (await this.createBatchRequest('BlockReceipts', blockTags, async (blockTag) => {
            return (0, blockReceipts_1.getBlockReceipts)(provider, blockTag, network);
        })).flat();
    }
    /**
     * Returns internal call traces for all transactions in each block.
     * @param provider Provider.
     * @param blockTags Block tags or numbers.
     * @param onlyTopCall If true, only fetch top-level calls.
     * @returns All call traces in those blocks.
     */
    async traceBlock(provider, blockTags, onlyTopCall) {
        return (await this.createBatchRequest('InternalTransactions', blockTags, async (blockTag) => {
            return (0, traceBlock_1.traceBlock)(provider, blockTag, onlyTopCall);
        })).flat();
    }
    /**
     * Returns internal call traces for specified transactions.
     * @param provider Provider.
     * @param txids Array of transaction hashes.
     * @param onlyTopCall If true, only fetch top-level call.
     * @returns CallTrace array for each transaction.
     */
    async traceTransaction(provider, txids, onlyTopCall) {
        return await this.createBatchRequest('InternalTransactions', txids, async (txid) => {
            return (0, traceBlock_1.traceTransaction)(provider, txid, onlyTopCall);
        });
    }
    /**
     * Fetch batches of event logs for given range (and contract/event).
     * @param args Query settings {address, provider, contract, event, fromBlock, toBlock}
     * @returns Array of Log/EventLog.
     */
    async getEvents({ address, provider, contract, event = '*', fromBlock = 0, toBlock, }) {
        // Must have valid number here to build correct array
        if (!toBlock) {
            toBlock = await (provider ||
                contract?.runner?.provider ||
                contract?.runner).getBlockNumber();
        }
        const eventTags = (0, utils_1.createBlockTags)(fromBlock, toBlock, this.eventRange, this.reverse);
        return (await this.createBatchRequest('Events', eventTags, async ({ fromBlock, toBlock }) => {
            if (address || !contract) {
                return await (0, events_1.multiQueryFilter)({
                    address,
                    provider,
                    contract,
                    event,
                    fromBlock,
                    toBlock,
                });
            }
            return await contract.queryFilter(event, fromBlock, toBlock);
        })).flat();
    }
    /**
     * Fetches arbitrary contract storage slots at a target block.
     * @param provider Provider.
     * @param contractAddress Target contract address.
     * @param storageKeys Keys to fetch.
     * @param blockTag Block number or tag.
     * @returns Array of string values.
     */
    async getStorageAt(provider, contractAddress, storageKeys, blockTag) {
        return await this.createBatchRequest('Storages', storageKeys, async (_storageKeys) => {
            return (0, proof_1.getStorageAt)(provider, contractAddress, _storageKeys, blockTag);
        });
    }
    /**
     * Finds a storage slot in the given range where the value is non-zero.
     * @param provider Provider instance.
     * @param contractAddress Target contract.
     * @param storageKeyGetter Function mapping an index to a storage slot.
     * @param blockTag Block context.
     * @param fromIndex Inclusive start index.
     * @param toIndex Inclusive end index.
     * @returns First index/slot found (or undefined if not found).
     */
    async findStorageKey(provider, contractAddress, storageKeyGetter, blockTag, fromIndex = 0, toIndex = 30) {
        const storageBatches = (0, utils_1.createBlockTags)(fromIndex, toIndex, this.batchSize * this.concurrencySize, this.reverse);
        for (const { fromBlock, toBlock } of storageBatches) {
            const indexes = (0, utils_1.range)(fromBlock, toBlock);
            const storageKeys = indexes.map((r) => storageKeyGetter(r));
            const storages = await this.getStorageAt(provider, contractAddress, storageKeys, blockTag);
            const foundKeyIndex = storages.findIndex((s) => BigInt(s));
            if (foundKeyIndex > -1) {
                return {
                    storageSlot: indexes[foundKeyIndex],
                    storageKey: storageKeys[foundKeyIndex],
                };
            }
        }
    }
}
exports.EthersBatcher = EthersBatcher;
