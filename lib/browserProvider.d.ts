import type { EventEmitter } from 'stream';
import type { Eip1193Provider, JsonRpcProvider, BrowserProviderOptions, JsonRpcSigner } from 'ethers';
import { type ProxySignerOptions } from './signer';
declare const ethBrowserProvider: typeof import("ethers").BrowserProvider;
/**
 * Options for adding or switching chains in a browser wallet.
 */
export interface AddEthereumChainParams {
    chainName?: string;
    chainSymbol?: string;
    rpcUrl?: string;
    explorerUrl?: string;
}
/**
 * Attempts to switch or add the given chain on the connected browser wallet.
 * @param chainId The target chain ID (bigint).
 * @param ethereum The browser EIP-1193 provider object.
 * @param params Optional parameters for chain addition.
 */
export declare function switchChain(chainId: bigint, ethereum: Eip1193Provider & {
    isTrust?: boolean;
}, params?: AddEthereumChainParams): Promise<void>;
/**
 * A callback type for browser events.
 */
export type browserCallBack = (...args: any[]) => void;
/**
 * Extended `BrowserProviderOptions` including chain metadata and callbacks.
 */
export interface BrowserProviderOptionsExt extends BrowserProviderOptions, AddEthereumChainParams, ProxySignerOptions {
    chainChanged?: browserCallBack;
    accountsChanged?: browserCallBack;
    disconnect?: browserCallBack;
}
/**
 * A BrowserProvider supporting EIP-1193, EIP-6963, and with handy event/callback integration.
 * Also supports injection of an 'appProvider' for extra context.
 */
export declare class BrowserProvider extends ethBrowserProvider {
    ethereum: Eip1193Provider & EventEmitter;
    appProvider?: JsonRpcProvider;
    options?: BrowserProviderOptionsExt;
    chainChanged?: browserCallBack;
    accountsChanged?: browserCallBack;
    disconnect?: browserCallBack;
    /**
     * Create a new BrowserProvider instance.
     * @param ethereum The injected EIP-1193 provider.
     * @param appProvider Optional fallback/provider for network context.
     * @param options Additional options.
     */
    constructor(ethereum: Eip1193Provider & EventEmitter, appProvider?: JsonRpcProvider, options?: BrowserProviderOptionsExt);
    /**
     * Returns a ProxySigner-wrapped JsonRpcSigner for the given address.
     * Handles chain switching automatically if required.
     * @param address Signer address to retrieve.
     * @returns Promise resolving to JsonRpcSigner instance.
     */
    getSigner(address: string): Promise<JsonRpcSigner>;
    /**
     * Supports EIP-6963 discovery for browser wallet providers; returns matching BrowserProviders.
     * https://github.com/ethers-io/ethers.js/commit/f5469dd0e0719389d51e0106ee36d07a7ebef875
     * @param appProvider Optional backend provider.
     * @param options Optional options.
     * @returns Promise resolving to an array of detected BrowserProvider instances.
     */
    static discoverProviders(appProvider?: JsonRpcProvider, options?: BrowserProviderOptionsExt): Promise<BrowserProvider[]>;
}
export {};
