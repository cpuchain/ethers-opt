import type { BaseContract, Block, BlockTag, ContractEventName, Log, EventLog, Provider, JsonRpcProvider, TransactionReceipt, TransactionResponse } from 'ethers';
import { CallTrace } from './traceBlock';
/**
 * Callback describing batch progress during requests.
 */
export type BatchOnProgress = (progress: {
    type: string;
    chunkIndex: number;
    chunkLength: number;
    chunks: any;
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
export declare function createBatchRequest<Input, Output>(params: CreateBatchRequestParams | undefined, type: string, inputs: Input[], outputFunc: (input: Input) => Promise<Output>): Promise<Output[]>;
export interface EthersBatcherParams extends CreateBatchRequestParams {
    ratePerSecond?: number;
    eventRange?: number;
}
/**
 * Helper class to fetch large amount of blocks / transactions / contract events
 * as quick as possible using batching and concurrent calls
 */
export declare class EthersBatcher {
    ratePerSecond: number;
    eventRange: number;
    concurrencySize: number;
    batchSize: number;
    delays: number;
    reverse: boolean;
    retryMax: number;
    retryOn: number;
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
    constructor({ ratePerSecond, eventRange, concurrencySize, batchSize: maxBatch, delays: _delays, reverse, retryMax, retryOn, onProgress, }?: EthersBatcherParams);
    createBatchRequest<Input, Output>(type: string, inputs: Input[], outputFunc: (input: Input) => Promise<Output>): Promise<Output[]>;
    /**
     * Batch function to fetch multiple blocks in parallel.
     * @param provider RPC provider.
     * @param blockTags List of block numbers or tags.
     * @param prefetchTxs True to also fetch transactions.
     * @returns Array of Block objects.
     */
    getBlocks(provider: Provider, blockTags: BlockTag[], prefetchTxs?: boolean): Promise<Block[]>;
    /**
     * Fetches transactions by their hashes in batches.
     * @param provider Provider to use.
     * @param txids Array of transaction hashes.
     * @returns Array of TransactionResponse objects.
     */
    getTransactions(provider: Provider, txids: string[]): Promise<TransactionResponse[]>;
    /**
     * Fetches multiple transaction receipts concurrently.
     * @param provider Provider to use.
     * @param txids Array of transaction hashes.
     * @returns Array of TransactionReceipt objects.
     */
    getTransactionReceipts(provider: Provider, txids: string[]): Promise<TransactionReceipt[]>;
    /**
     * Fetches receipts for all transactions in specified blocks.
     * @param provider JsonRpcProvider instance.
     * @param blockTags Block tags or numbers.
     * @returns Array of receipts.
     */
    getBlockReceipts(provider: JsonRpcProvider, blockTags: BlockTag[]): Promise<TransactionReceipt[]>;
    /**
     * Returns internal call traces for all transactions in each block.
     * @param provider Provider.
     * @param blockTags Block tags or numbers.
     * @param onlyTopCall If true, only fetch top-level calls.
     * @returns All call traces in those blocks.
     */
    traceBlock(provider: JsonRpcProvider, blockTags: BlockTag[], onlyTopCall?: boolean): Promise<CallTrace[]>;
    /**
     * Returns internal call traces for specified transactions.
     * @param provider Provider.
     * @param txids Array of transaction hashes.
     * @param onlyTopCall If true, only fetch top-level call.
     * @returns CallTrace array for each transaction.
     */
    traceTransaction(provider: JsonRpcProvider, txids: string[], onlyTopCall?: boolean): Promise<CallTrace[]>;
    /**
     * Fetch batches of event logs for given range (and contract/event).
     * @param args Query settings {address, provider, contract, event, fromBlock, toBlock}
     * @returns Array of Log/EventLog.
     */
    getEvents({ address, provider, contract, event, fromBlock, toBlock, }: {
        address?: string | string[];
        provider?: Provider;
        contract?: BaseContract;
        event?: ContractEventName;
        fromBlock?: number;
        toBlock?: number;
    }): Promise<(Log | EventLog)[]>;
    /**
     * Fetches arbitrary contract storage slots at a target block.
     * @param provider Provider.
     * @param contractAddress Target contract address.
     * @param storageKeys Keys to fetch.
     * @param blockTag Block number or tag.
     * @returns Array of string values.
     */
    getStorageAt(provider: Provider, contractAddress: string, storageKeys: string[], blockTag?: BlockTag): Promise<string[]>;
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
    findStorageKey(provider: Provider, contractAddress: string, storageKeyGetter: (index: number) => string, blockTag?: BlockTag, fromIndex?: number, toIndex?: number): Promise<{
        storageSlot: number;
        storageKey: string;
    } | undefined>;
}
