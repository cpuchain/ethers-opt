import type { JsonRpcProvider, BlockTag, BlockParams, TransactionResponse } from 'ethers';
/**
 * Details for a call trace (internal transaction) within a transaction or block.
 */
export interface CallTrace {
    from: string;
    gas: number;
    gasUsed: number;
    to: string;
    input: string;
    output?: string;
    calls?: any;
    value: bigint;
    type: string;
    blockNumber: number;
    blockHash?: string;
    txHash: string;
}
/**
 * Formats a raw trace response from debug_traceBlock/tx into structured CallTrace.
 * @param params Raw trace params.
 * @param txHash Transaction hash.
 * @param blockParams Block context (number, hash).
 * @returns Formatte CallTrace internal transaction object
 */
export declare function formatCallTrace(params: any, txHash: string, blockParams: BlockParams): CallTrace;
/**
 * Traces all transactions in a block for internal calls using debug_traceBlock...
 * @param provider JsonRpcProvider.
 * @param blockTag Block number/tag/hash (default: latest).
 * @param onlyTopCall If true, only include top-level calls.
 * @returns Array of call traces, one for each transaction.
 */
export declare function traceBlock(provider: JsonRpcProvider, blockTag?: BlockTag, onlyTopCall?: boolean): Promise<CallTrace[]>;
/**
 * Traces a single transaction's internal execution via debug_traceTransaction.
 * @param provider Provider instance.
 * @param hash Transaction hash to trace.
 * @param onlyTopCall If true, limit to top-level call.
 * @param txResp Optionally a preloaded transaction response.
 * @returns Structured CallTrace.
 */
export declare function traceTransaction(provider: JsonRpcProvider, hash: string, onlyTopCall?: boolean, txResp?: TransactionResponse): Promise<CallTrace>;
