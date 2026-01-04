import {
    BlockTag,
    Network,
    Networkish,
    FetchRequest,
    Provider as ethProvider,
    JsonRpcApiProvider,
    JsonRpcApiProviderOptions,
    PerformActionRequest,
    TransactionReceipt,
    TransactionResponse,
    assert,
    AbiCoder,
    JsonRpcProvider,
    FeeData,
    defineProperties,
} from 'ethers';
import { Multicall, Multicall__factory } from './typechain/index.js';
import { MULTICALL_ADDRESS } from './multicall.js';
import { chainNames, EnsResolver } from './ens/index.js';
import { formatFeeHistory } from './feeEstimator.js';
import { chunk, sleep } from './utils.js';
import { CallTrace, traceBlock, traceTransaction } from './traceBlock.js';
import { getBlockReceipts } from './blockReceipts.js';
import { fetchOptions, getUrlFunc } from './getUrl.js';

/**
 * Result for a single Multicall call.
 */
export interface MulticallResult {
    status: boolean;
    data: string;
}

/**
 * State object for a batched Multicall request.
 */
export interface MulticallHandle {
    id: number;
    request: { to: string; data: string };
    resolve: (result: MulticallResult) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reject: (error: any) => void;
    resolved: boolean;
    called: boolean;
}

function toJson(value: null | bigint): null | string {
    if (value == null) {
        return null;
    }
    return value.toString();
}

/**
 * Extension of ethers' FeeData for more granular priority fee tracking.
 */
export class FeeDataExt extends FeeData {
    readonly maxPriorityFeePerGasSlow!: null | bigint;

    readonly maxPriorityFeePerGasMedium!: null | bigint;

    /**
     * @param gasPrice The gas price or null.
     * @param maxFeePerGas The EIP-1559 max fee per gas.
     * @param maxPriorityFeePerGas The max priority fee per gas.
     * @param maxPriorityFeePerGasSlow Optional: Lower percentile priority fee.
     * @param maxPriorityFeePerGasMedium Optional: Medium percentile priority fee.
     */
    constructor(
        gasPrice?: null | bigint,
        maxFeePerGas?: null | bigint,
        maxPriorityFeePerGas?: null | bigint,
        maxPriorityFeePerGasSlow?: null | bigint,
        maxPriorityFeePerGasMedium?: null | bigint,
    ) {
        super(gasPrice, maxFeePerGas, maxPriorityFeePerGas);

        defineProperties<FeeDataExt>(this, {
            gasPrice: typeof gasPrice === 'bigint' ? (gasPrice as bigint) : null,
            maxFeePerGas: typeof maxFeePerGas === 'bigint' ? (maxFeePerGas as bigint) : null,
            maxPriorityFeePerGas:
                typeof maxPriorityFeePerGas === 'bigint' ? (maxPriorityFeePerGas as bigint) : null,
            maxPriorityFeePerGasSlow:
                typeof maxPriorityFeePerGasSlow === 'bigint' ? (maxPriorityFeePerGasSlow as bigint) : null,
            maxPriorityFeePerGasMedium:
                typeof maxPriorityFeePerGasMedium === 'bigint'
                    ? (maxPriorityFeePerGasMedium as bigint)
                    : null,
        });
    }

    /**
     *  Returns a JSON-friendly value.
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    toJSON(): any {
        return {
            _type: 'FeeData',
            gasPrice: toJson(this.gasPrice),
            maxFeePerGas: toJson(this.maxFeePerGas),
            maxPriorityFeePerGas: toJson(this.maxPriorityFeePerGas),
            maxPriorityFeePerGasSlow: toJson(this.maxPriorityFeePerGasSlow),
            maxPriorityFeePerGasMedium: toJson(this.maxPriorityFeePerGasMedium),
        };
    }
}

/**
 * Provider configuration options, including multicall, fees, ENS handling, and more.
 */
export interface ProviderOptions extends JsonRpcApiProviderOptions {
    hardhatProvider?: ethProvider;
    fetchOptions?: fetchOptions;

    chainId?: bigint | number;

    ensResolver?: typeof EnsResolver;

    feeHistory?: boolean;

    multicall?: string;
    multicallAllowFailure?: boolean;
    multicallMaxCount?: number;
    multicallStallTime?: number;
}

/**
 * Enhanced Ethers Provider with Multicall, static network detection, batch fee data, and ENS support.
 *
 * (Which comes with static network, multicaller enabled by defaut)
 * (Multicaller inspired by https://github.com/ethers-io/ext-provider-multicall)
 */
export class Provider extends JsonRpcProvider {
    hardhatProvider?: ethProvider;

    staticNetwork: Promise<Network>;
    #network?: Network;

    ensResolver: Promise<typeof EnsResolver>;

    // Fetch feeHistory
    feeHistory: boolean;

    /**
     * Multicall obj
     */
    multicall: Multicall;

    multicallAllowFailure: boolean;
    // To disable multicall use multicallMaxCount: 0
    multicallMaxCount: number;
    multicallStallTime: number;
    multicallQueue: MulticallHandle[];
    multicallTimer: null | ReturnType<typeof setTimeout>;

    /**
     * Create a new Provider.
     * @param url RPC URL or FetchRequest.
     * @param network Networkish.
     * @param options Provider options.
     */
    constructor(url?: string | FetchRequest, network?: Networkish, options?: ProviderOptions) {
        // 30ms (default)
        const multicallStallTime = options?.multicallStallTime ?? 30;
        // 10ms (default) + 30ms (default)
        const batchStallTime = multicallStallTime + (options?.batchStallTime ?? 10);

        const fetchRequest = typeof url === 'string' ? new FetchRequest(url) : url;

        if (fetchRequest) {
            fetchRequest.getUrlFunc = getUrlFunc(options?.fetchOptions);
        }

        super(fetchRequest, network, {
            ...(options || {}),
            batchStallTime,
        });

        this.hardhatProvider = options?.hardhatProvider;

        this.feeHistory = options?.feeHistory ?? false;

        this.staticNetwork = (async () => {
            if (network) {
                return Network.from(network);
            }

            if (options?.hardhatProvider) {
                return Network.from(await options.hardhatProvider.getNetwork());
            }

            const _network = Network.from(await new JsonRpcProvider(fetchRequest).getNetwork());

            if (options?.chainId && BigInt(_network.chainId) !== BigInt(options.chainId)) {
                throw new Error('Wrong network');
            }

            this.#network = _network;

            return _network;
        })();

        // Set default ENS resolver
        this.ensResolver = this.staticNetwork.then(({ chainId }) => {
            const ensType = chainNames[Number(chainId)] || 'ENS';

            if (options?.ensResolver) {
                return options.ensResolver;
            }

            if (ensType === 'ENS') {
                return EnsResolver;
            }

            throw new Error('Unsupported ENS type');
        });

        this.multicall = Multicall__factory.connect(options?.multicall || MULTICALL_ADDRESS, this);

        this.multicallAllowFailure = options?.multicallAllowFailure ?? true;
        this.multicallMaxCount = options?.multicallMaxCount ?? 1000;
        this.multicallStallTime = multicallStallTime;
        this.multicallQueue = [];
        this.multicallTimer = null;
    }

    /** Gets the detected or static network. */
    get _network(): Network {
        assert(this.#network, 'network is not available yet', 'NETWORK_ERROR');
        return this.#network;
    }

    /** @override Resolves to the network, or throws and ensures auto-destroy on error. */
    async _detectNetwork(): Promise<Network> {
        try {
            return await this.staticNetwork;
        } catch (error) {
            // Prevent internal loop to keep alive
            if (!super.destroyed) {
                super.destroy();
            }
            throw error;
        }
    }

    /**
     * Override getFeeData func from AbstractProvider to get results as-is.
     *
     * Return fee as is from provider, it is up to populateTransaction func to compose them
     *
     * Note that in some networks (like L2), maxFeePerGas can be smaller than maxPriorityFeePerGas and if so,
     * using the value as is could throw an error from RPC as maxFeePerGas should be always bigger than maxPriorityFeePerGas
     *
     * @returns Promise resolving to FeeDataExt instance.
     */
    async getFeeData(): Promise<FeeDataExt> {
        const [
            gasPrice,
            maxFeePerGas,
            maxPriorityFeePerGas,
            [maxPriorityFeePerGasMedium, maxPriorityFeePerGasSlow],
        ] = await Promise.all([
            (async () => {
                try {
                    return BigInt(await this.send('eth_gasPrice', []));
                } catch {
                    return 0n;
                }
            })(),
            (async () => {
                const block = await this.getBlock('latest');

                return block?.baseFeePerGas ?? null;
            })(),
            (async () => {
                try {
                    return BigInt(await this.send('eth_maxPriorityFeePerGas', []));
                } catch {
                    return 0n;
                }
            })(),
            (async () => {
                try {
                    if (!this.feeHistory) {
                        return [null, null];
                    }

                    const blocks = 10;
                    const { priorityFeePerGasAvg } = formatFeeHistory(
                        await this.send('eth_feeHistory', [blocks, 'pending', [10, 25]]),
                        blocks,
                    );

                    return [priorityFeePerGasAvg[0], priorityFeePerGasAvg[1]];
                } catch {
                    return [null, null];
                }
            })(),
        ]);

        return new FeeDataExt(
            gasPrice,
            maxFeePerGas,
            maxPriorityFeePerGas,
            maxPriorityFeePerGasMedium,
            maxPriorityFeePerGasSlow,
        );
    }

    /**
     * Returns the ENS resolver for the specified name.
     * @param name ENS name to resolve.
     * @returns Resolves to an EnsResolver or null.
     */
    async getResolver(name: string): Promise<null | EnsResolver> {
        return (await this.ensResolver).fromName(this, name);
    }

    /**
     * Performs a reverse-lookup (address to ENS, if any).
     * @param address Address to lookup.
     * @param reverseCheck Perform confirmation roundtrip.
     * @returns ENS name or null.
     */
    async lookupAddress(address: string, reverseCheck?: boolean): Promise<null | string> {
        return (await this.ensResolver).lookupAddress(this, address, reverseCheck);
    }

    /**
     * Waits for specified transaction (or hash) to confirm, with default timeout.
     * Does not throw on timeout.
     * @param hashOrTx TransactionResponse or hash or null.
     * @returns Null or the TransactionReceipt if confirmed.
     */
    async wait(hashOrTx: null | string | TransactionResponse): Promise<null | TransactionReceipt> {
        try {
            if (!hashOrTx) {
                return null;
            }

            const hash = (hashOrTx as TransactionResponse)?.hash || (hashOrTx as string);

            return await this.waitForTransaction(hash, 1, 60 * 1000);
        } catch {
            return null;
        }
    }

    /**
     * Returns whether an address has code (i.e., is a contract) on-chain.
     * @param address Address to check.
     * @returns True if code exists (contract), false otherwise.
     */
    async hasCode(address: string) {
        const code = await this.getCode(address);

        return code && code !== '0x' ? true : false;
    }

    /**
     * Gets receipts for all transactions in a block as an array.
     * @param blockTag Block to query.
     * @returns Promise resolving to an array of TransactionReceipts.
     */
    async getBlockReceipts(blockTag?: BlockTag): Promise<TransactionReceipt[]> {
        return getBlockReceipts(this, blockTag, this.#network);
    }

    /**
     * Trace internal calls for a whole block.
     * @param blockTag Block to trace.
     * @param onlyTopCall If true, only trace top-level calls.
     * @returns Array of CallTrace objects for each transaction in the block.
     */
    async traceBlock(blockTag?: BlockTag, onlyTopCall?: boolean): Promise<CallTrace[]> {
        return traceBlock(this, blockTag, onlyTopCall);
    }

    /**
     * Trace internal calls for a given transaction hash.
     * @param hash Transaction hash.
     * @param onlyTopCall If true, only trace the top-level call.
     * @returns CallTrace object for the traced transaction.
     */
    async traceTransaction(hash: string, onlyTopCall?: boolean): Promise<CallTrace> {
        return traceTransaction(this, hash, onlyTopCall);
    }

    /**
     * Multicaller
     */
    async _drainCalls() {
        try {
            const queue = this.multicallQueue.filter((q) => !q.called);

            // Exclude from called
            queue.forEach((q) => {
                const qIndex = this.multicallQueue.findIndex((r) => r.id === q.id);

                if (qIndex > -1) {
                    this.multicallQueue[qIndex].called = true;
                }
            });

            // Split > 100 calls to chunks and do seperate batch calls
            await Promise.all(
                chunk(queue, this.multicallMaxCount).map(async (_chunk, chunkIndex) => {
                    // Avoid batching but do concurrent requests
                    await sleep(40 * chunkIndex);

                    const results = await this.multicall.aggregate3.staticCall(
                        _chunk.map(({ request: { to: target, data: callData } }) => ({
                            target,
                            callData,
                            allowFailure: this.multicallAllowFailure,
                        })),
                    );

                    results.forEach(([status, data], i) => {
                        const queue = _chunk[i];
                        const qIndex = this.multicallQueue.findIndex((r) => r.id === queue?.id || 0);

                        if (qIndex > -1) {
                            this.multicallQueue[qIndex].resolve({ status, data } as MulticallResult);
                            this.multicallQueue[qIndex].resolved = true;
                        }
                    });
                }),
            );
        } catch (err) {
            this.multicallQueue.forEach((queue) => {
                queue.reject(err);
                queue.resolved = true;
            });
        }

        this.multicallQueue = this.multicallQueue.filter(({ resolved }) => !resolved);
    }

    /**
     * Queue a Multicall aggregate3 call (internal).
     * @private
     * @param to Call target address.
     * @param data Calldata.
     */
    _queueCall(to: string, data = '0x'): Promise<MulticallResult> {
        if (!this.multicallTimer) {
            this.multicallTimer = setTimeout(() => {
                this._drainCalls();
                this.multicallTimer = null;
            }, this.multicallStallTime);
        }

        return new Promise((resolve, reject) => {
            this.multicallQueue.push({
                id: Math.floor(Math.random() * Date.now()),
                request: { to, data },
                resolve,
                reject,
                resolved: false,
                called: false,
            });
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async _perform<T = any>(req: PerformActionRequest): Promise<T> {
        if (req.method === 'call' && this.multicallMaxCount > 0) {
            const { from, to, value, data, blockTag } = req.transaction;

            const isAggregate3 = to === this.multicall.target && data?.startsWith('0x82ad56cb');

            // Only aggregate static calls without value and with latest block tag
            if (!from && to && !value && (!blockTag || blockTag === 'latest') && !isAggregate3) {
                const { status, data: result } = await this._queueCall(to, data);

                if (status) {
                    return result as T;
                } else {
                    // Throw a CallException
                    throw AbiCoder.getBuiltinCallException('call', { to, data }, result);
                }
            }
        }

        return super._perform(req);
    }

    /**
     * For Hardhat test environments, reroutes .send() calls to the in-memory provider.
     * @override
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async send(method: string, params: any[] | Record<string, any>): Promise<any> {
        if (this.hardhatProvider) {
            return (this.hardhatProvider as JsonRpcApiProvider).send(method, params);
        }
        return super.send(method, params);
    }
}
