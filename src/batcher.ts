import type {
    BaseContract,
    Block,
    BlockTag,
    ContractEventName,
    Log,
    EventLog,
    Provider,
    JsonRpcProvider,
    TransactionReceipt,
    TransactionResponse,
} from 'ethers';
import { chunk, createBatchRateConfig, createBlockTags, range, sleep } from './utils.js';
import { multiQueryFilter } from './events.js';
import { getBlockReceipts } from './blockReceipts.js';
import { type CallTrace, traceBlock, traceTransaction } from './traceBlock.js';
import { getStorageAt } from './proof.js';

/**
 * Callback describing batch progress during requests.
 */
export type BatchOnProgress = (progress: {
    type: string;
    chunkIndex: number;
    chunkLength: number;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chunks: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    chunksResult: any;
    resultLength: number;
}) => void;

/**
 * Options for configuring a generic batch request.
 */
export interface CreateBatchRequestParams {
    concurrencySize?: number;
    batchSize?: number;

    delays?: number;
    reverse?: boolean;

    retryMax?: number;
    retryOn?: number;

    onProgress?: BatchOnProgress;
}

/**
 * Runs batch requests concurrently and in chunks for rate-limited APIs.
 * Handles retry and calls outputFunc for each batch.
 * @param params Batch request options.
 * @param type Type name for logging/progress.
 * @param inputs Array of input values.
 * @param outputFunc The async function to call for each input.
 * @returns Array of output results.
 */
export async function createBatchRequest<Input, Output>(
    params: CreateBatchRequestParams = {},
    type: string,
    inputs: Input[],
    outputFunc: (input: Input) => Promise<Output>,
): Promise<Output[]> {
    const concurrencySize = params.concurrencySize || 10;
    const batchSize = params.batchSize || 10;
    const retryMax = params.retryMax || 2;
    const retryOn = params.retryOn || 500;

    let chunkIndex = 0;
    const results: Output[] = [];

    for (const chunks of chunk(inputs, concurrencySize * batchSize)) {
        const timeStart = Date.now();

        const chunksResult = (
            await Promise.all(
                chunk(chunks, batchSize).map(async (_inputs, batchIndex) => {
                    // 40ms since default batch requests are collected with 50ms from provider
                    await sleep(40 * batchIndex);

                    return (async () => {
                        let retries = 0;
                        let err;

                        while (retries <= retryMax) {
                            try {
                                return await Promise.all(_inputs.map((input) => outputFunc(input)));
                            } catch (e) {
                                retries++;
                                err = e;

                                await sleep(retryOn);
                            }
                        }

                        throw err;
                    })();
                }),
            )
        ).flat();

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
            await sleep(params.delays - (Date.now() - timeStart));
        }
    }

    return results;
}

export interface EthersBatcherParams extends CreateBatchRequestParams {
    ratePerSecond?: number;
    eventRange?: number;
}

/**
 * Helper class to fetch large amount of blocks / transactions / contract events
 * as quick as possible using batching and concurrent calls
 */
export class EthersBatcher {
    ratePerSecond: number;
    eventRange: number; // eth_getLogs block range

    concurrencySize: number;
    batchSize: number;
    delays: number;
    reverse: boolean;

    retryMax: number; // Max retry count
    retryOn: number; // Retry on millisecond

    onProgress?: BatchOnProgress;

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
    constructor({
        ratePerSecond,
        eventRange,
        concurrencySize,
        batchSize: maxBatch,
        delays: _delays,
        reverse,
        retryMax,
        retryOn,
        onProgress,
    }: EthersBatcherParams = {}) {
        this.ratePerSecond = ratePerSecond || 10;
        this.eventRange = eventRange || 5000;

        const { concurrency, batchSize, delays } = createBatchRateConfig(
            this.ratePerSecond,
            maxBatch,
            _delays,
        );

        this.concurrencySize = concurrencySize || concurrency;
        this.batchSize = batchSize;
        this.delays = delays;
        this.reverse = reverse ?? false;

        this.retryMax = retryMax || 2;
        this.retryOn = retryOn || 500;

        this.onProgress = onProgress;
    }

    async createBatchRequest<Input, Output>(
        type: string,
        inputs: Input[],
        outputFunc: (input: Input) => Promise<Output>,
    ): Promise<Output[]> {
        return createBatchRequest<Input, Output>(this, type, inputs, outputFunc);
    }

    /**
     * Batch function to fetch multiple blocks in parallel.
     * @param provider RPC provider.
     * @param blockTags List of block numbers or tags.
     * @param prefetchTxs True to also fetch transactions.
     * @returns Array of Block objects.
     */
    async getBlocks(provider: Provider, blockTags: BlockTag[], prefetchTxs?: boolean): Promise<Block[]> {
        return await this.createBatchRequest<BlockTag, Block>('Blocks', blockTags, async (blockTag) => {
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
    async getTransactions(provider: Provider, txids: string[]): Promise<TransactionResponse[]> {
        return await this.createBatchRequest<string, TransactionResponse>(
            'Transactions',
            txids,
            async (txid) => {
                const tx = await provider.getTransaction(txid);

                if (!tx) {
                    throw new Error(`No tx for ${txid}`);
                }

                return tx;
            },
        );
    }

    /**
     * Fetches multiple transaction receipts concurrently.
     * @param provider Provider to use.
     * @param txids Array of transaction hashes.
     * @returns Array of TransactionReceipt objects.
     */
    async getTransactionReceipts(provider: Provider, txids: string[]): Promise<TransactionReceipt[]> {
        return await this.createBatchRequest<string, TransactionReceipt>(
            'TransactionReceipts',
            txids,
            async (txid) => {
                const tx = await provider.getTransactionReceipt(txid);

                if (!tx) {
                    throw new Error(`No tx for ${txid}`);
                }

                return tx;
            },
        );
    }

    /**
     * Fetches receipts for all transactions in specified blocks.
     * @param provider JsonRpcProvider instance.
     * @param blockTags Block tags or numbers.
     * @returns Array of receipts.
     */
    async getBlockReceipts(provider: JsonRpcProvider, blockTags: BlockTag[]): Promise<TransactionReceipt[]> {
        const network = await provider.getNetwork();

        return (
            await this.createBatchRequest<BlockTag, TransactionReceipt[]>(
                'BlockReceipts',
                blockTags,
                async (blockTag) => {
                    return getBlockReceipts(provider, blockTag, network);
                },
            )
        ).flat();
    }

    /**
     * Returns internal call traces for all transactions in each block.
     * @param provider Provider.
     * @param blockTags Block tags or numbers.
     * @param onlyTopCall If true, only fetch top-level calls.
     * @returns All call traces in those blocks.
     */
    async traceBlock(
        provider: JsonRpcProvider,
        blockTags: BlockTag[],
        onlyTopCall?: boolean,
    ): Promise<CallTrace[]> {
        return (
            await this.createBatchRequest<BlockTag, CallTrace[]>(
                'InternalTransactions',
                blockTags,
                async (blockTag) => {
                    return traceBlock(provider, blockTag, onlyTopCall);
                },
            )
        ).flat();
    }

    /**
     * Returns internal call traces for specified transactions.
     * @param provider Provider.
     * @param txids Array of transaction hashes.
     * @param onlyTopCall If true, only fetch top-level call.
     * @returns CallTrace array for each transaction.
     */
    async traceTransaction(
        provider: JsonRpcProvider,
        txids: string[],
        onlyTopCall?: boolean,
    ): Promise<CallTrace[]> {
        return await this.createBatchRequest<string, CallTrace>(
            'InternalTransactions',
            txids,
            async (txid) => {
                return traceTransaction(provider, txid, onlyTopCall);
            },
        );
    }

    /**
     * Fetch batches of event logs for given range (and contract/event).
     * @param args Query settings {address, provider, contract, event, fromBlock, toBlock}
     * @returns Array of Log/EventLog.
     */
    async getEvents({
        address,
        provider,
        contract,
        event = '*',
        fromBlock = 0,
        toBlock,
    }: {
        address?: string | string[];
        provider?: Provider;
        contract?: BaseContract;
        event?: ContractEventName;
        fromBlock?: number;
        toBlock?: number;
    }): Promise<(Log | EventLog)[]> {
        // Must have valid number here to build correct array
        if (!toBlock) {
            toBlock = await (
                provider ||
                (contract?.runner?.provider as Provider) ||
                (contract?.runner as Provider)
            ).getBlockNumber();
        }

        const eventTags = createBlockTags(fromBlock, toBlock, this.eventRange, this.reverse);

        return (
            await this.createBatchRequest<{ fromBlock: number; toBlock: number }, (Log | EventLog)[]>(
                'Events',
                eventTags,
                async ({ fromBlock, toBlock }) => {
                    if (address || !contract) {
                        return await multiQueryFilter({
                            address,
                            provider,
                            contract,
                            event,
                            fromBlock,
                            toBlock,
                        });
                    }
                    return await contract.queryFilter(event, fromBlock, toBlock);
                },
            )
        ).flat();
    }

    /**
     * Fetches arbitrary contract storage slots at a target block.
     * @param provider Provider.
     * @param contractAddress Target contract address.
     * @param storageKeys Keys to fetch.
     * @param blockTag Block number or tag.
     * @returns Array of string values.
     */
    async getStorageAt(
        provider: Provider,
        contractAddress: string,
        storageKeys: string[],
        blockTag?: BlockTag,
    ): Promise<string[]> {
        return await this.createBatchRequest<string, string>(
            'Storages',
            storageKeys,
            async (_storageKeys) => {
                return getStorageAt(provider, contractAddress, _storageKeys, blockTag);
            },
        );
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
    async findStorageKey(
        provider: Provider,
        contractAddress: string,
        storageKeyGetter: (index: number) => string,
        blockTag?: BlockTag,
        fromIndex = 0,
        toIndex = 30,
    ): Promise<{ storageSlot: number; storageKey: string } | undefined> {
        const storageBatches = createBlockTags(
            fromIndex,
            toIndex,
            this.batchSize * this.concurrencySize,
            this.reverse,
        );

        for (const { fromBlock, toBlock } of storageBatches) {
            const indexes = range(fromBlock, toBlock);
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
