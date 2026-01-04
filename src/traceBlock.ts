import { JsonRpcProvider, BlockTag, BlockParams, TransactionResponse, getAddress } from 'ethers';

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function formatCallTrace(params: any, txHash: string, blockParams: BlockParams): CallTrace {
    return {
        from: params.from ? getAddress(params.from) : '',
        gas: Number(params.gas || 0),
        gasUsed: Number(params.gasUsed || 0),
        to: params.to ? getAddress(params.to) : '',
        input: params.input,
        output: params.output,
        calls: params.calls,
        value: BigInt(params.value || 0),
        type: params.type,
        blockNumber: blockParams.number,
        blockHash: blockParams.hash || undefined,
        txHash,
    };
}

/**
 * Traces all transactions in a block for internal calls using debug_traceBlock...
 * @param provider JsonRpcProvider.
 * @param blockTag Block number/tag/hash (default: latest).
 * @param onlyTopCall If true, only include top-level calls.
 * @returns Array of call traces, one for each transaction.
 */
export async function traceBlock(
    provider: JsonRpcProvider,
    blockTag?: BlockTag,
    onlyTopCall = false,
): Promise<CallTrace[]> {
    const parsedBlock = (blockTag ? provider._getBlockTag(blockTag) : 'latest') as string;

    const method = parsedBlock.length === 66 ? 'debug_traceBlockByHash' : 'debug_traceBlockByNumber';

    const [block, resp] = await Promise.all([
        typeof blockTag === 'number' ? { number: blockTag, hash: undefined } : provider.getBlock(parsedBlock),
        provider.send(method, [
            parsedBlock,
            {
                tracer: 'callTracer',
                traceConfig: {
                    onlyTopCall,
                },
            },
        ]),
    ]);

    if (!block) {
        throw new Error(`Invalid block for ${blockTag}`);
    }

    if (!resp) {
        throw new Error(`No trace results for block ${blockTag}`);
    }

    return (resp as { txHash: string; result: CallTrace }[]).map(({ txHash, result }) =>
        formatCallTrace(result, txHash, block as unknown as BlockParams),
    );
}

/**
 * Traces a single transaction's internal execution via debug_traceTransaction.
 * @param provider Provider instance.
 * @param hash Transaction hash to trace.
 * @param onlyTopCall If true, limit to top-level call.
 * @param txResp Optionally a preloaded transaction response.
 * @returns Structured CallTrace.
 */
export async function traceTransaction(
    provider: JsonRpcProvider,
    hash: string,
    onlyTopCall = false,
    txResp?: TransactionResponse,
) {
    const [tx, resp] = await Promise.all([
        txResp || provider.getTransaction(hash),
        provider.send('debug_traceTransaction', [
            hash,
            {
                tracer: 'callTracer',
                traceConfig: {
                    onlyTopCall,
                },
            },
        ]),
    ]);

    if (!tx) {
        throw new Error(`Invalid tx for ${tx}`);
    }

    if (!resp) {
        throw new Error(`No trace results for tx ${hash}`);
    }

    return formatCallTrace(resp, hash, {
        number: tx.blockNumber as number,
        hash: tx.blockHash,
    } as BlockParams);
}
