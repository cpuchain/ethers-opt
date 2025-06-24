import type { BlockTag, Network, Networkish, FetchRequest, Provider as ethProvider, JsonRpcApiProviderOptions, PerformActionRequest, TransactionReceipt, TransactionResponse } from 'ethers';
import { Multicall } from './typechain';
import { EnsResolver } from './ens';
import { CallTrace } from './traceBlock';
declare const ethJsonRpcProvider: typeof import("ethers").JsonRpcProvider, ethFeeData: typeof import("ethers").FeeData;
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
    request: {
        to: string;
        data: string;
    };
    resolve: (result: MulticallResult) => void;
    reject: (error: any) => void;
    resolved: boolean;
}
/**
 * Extension of ethers' FeeData for more granular priority fee tracking.
 */
export declare class FeeDataExt extends ethFeeData {
    readonly maxPriorityFeePerGasSlow: null | bigint;
    readonly maxPriorityFeePerGasMedium: null | bigint;
    /**
     * @param gasPrice The gas price or null.
     * @param maxFeePerGas The EIP-1559 max fee per gas.
     * @param maxPriorityFeePerGas The max priority fee per gas.
     * @param maxPriorityFeePerGasSlow Optional: Lower percentile priority fee.
     * @param maxPriorityFeePerGasMedium Optional: Medium percentile priority fee.
     */
    constructor(gasPrice?: null | bigint, maxFeePerGas?: null | bigint, maxPriorityFeePerGas?: null | bigint, maxPriorityFeePerGasSlow?: null | bigint, maxPriorityFeePerGasMedium?: null | bigint);
    /**
     *  Returns a JSON-friendly value.
     */
    toJSON(): any;
}
/**
 * Provider configuration options, including multicall, fees, ENS handling, and more.
 */
export interface ProviderOptions extends JsonRpcApiProviderOptions {
    hardhatProvider?: ethProvider;
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
export declare class Provider extends ethJsonRpcProvider {
    #private;
    hardhatProvider?: ethProvider;
    staticNetwork: Promise<Network>;
    ensResolver: Promise<typeof EnsResolver>;
    feeHistory: boolean;
    /**
     * Multicall obj
     */
    multicall: Multicall;
    multicallAllowFailure: boolean;
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
    constructor(url?: string | FetchRequest, network?: Networkish, options?: ProviderOptions);
    /** Gets the detected or static network. */
    get _network(): Network;
    /** @override Resolves to the network, or throws and ensures auto-destroy on error. */
    _detectNetwork(): Promise<Network>;
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
    getFeeData(): Promise<FeeDataExt>;
    /**
     * Returns the ENS resolver for the specified name.
     * @param name ENS name to resolve.
     * @returns Resolves to an EnsResolver or null.
     */
    getResolver(name: string): Promise<null | EnsResolver>;
    /**
     * Performs a reverse-lookup (address to ENS, if any).
     * @param address Address to lookup.
     * @param reverseCheck Perform confirmation roundtrip.
     * @returns ENS name or null.
     */
    lookupAddress(address: string, reverseCheck?: boolean): Promise<null | string>;
    /**
     * Waits for specified transaction (or hash) to confirm, with default timeout.
     * Does not throw on timeout.
     * @param hashOrTx TransactionResponse or hash or null.
     * @returns Null or the TransactionReceipt if confirmed.
     */
    wait(hashOrTx: null | string | TransactionResponse): Promise<null | TransactionReceipt>;
    /**
     * Returns whether an address has code (i.e., is a contract) on-chain.
     * @param address Address to check.
     * @returns True if code exists (contract), false otherwise.
     */
    hasCode(address: string): Promise<boolean>;
    /**
     * Gets receipts for all transactions in a block as an array.
     * @param blockTag Block to query.
     * @returns Promise resolving to an array of TransactionReceipts.
     */
    getBlockReceipts(blockTag?: BlockTag): Promise<TransactionReceipt[]>;
    /**
     * Trace internal calls for a whole block.
     * @param blockTag Block to trace.
     * @param onlyTopCall If true, only trace top-level calls.
     * @returns Array of CallTrace objects for each transaction in the block.
     */
    traceBlock(blockTag?: BlockTag, onlyTopCall?: boolean): Promise<CallTrace[]>;
    /**
     * Trace internal calls for a given transaction hash.
     * @param hash Transaction hash.
     * @param onlyTopCall If true, only trace the top-level call.
     * @returns CallTrace object for the traced transaction.
     */
    traceTransaction(hash: string, onlyTopCall?: boolean): Promise<CallTrace>;
    /**
     * Multicaller
     */
    _drainCalls(): Promise<void>;
    /**
     * Queue a Multicall aggregate3 call (internal).
     * @private
     * @param to Call target address.
     * @param data Calldata.
     */
    _queueCall(to: string, data?: string): Promise<MulticallResult>;
    _perform<T = any>(req: PerformActionRequest): Promise<T>;
    /**
     * For Hardhat test environments, reroutes .send() calls to the in-memory provider.
     * @override
     */
    send(method: string, params: any[] | Record<string, any>): Promise<any>;
}
export {};
