import type { EventEmitter } from 'stream';
import {
    Eip1193Provider,
    JsonRpcProvider,
    BrowserProvider as ethBrowserProvider,
    BrowserProviderOptions,
    Eip6963ProviderInfo,
    JsonRpcSigner,
    toQuantity,
} from 'ethers';
import { type ProxySignerOptions, ProxySigner } from './signer.js';

interface Eip6963ProviderDetail {
    info: Eip6963ProviderInfo;
    provider: Eip1193Provider & EventEmitter;
}

interface Eip6963Announcement {
    type: 'eip6963:announceProvider';
    detail: Eip6963ProviderDetail;
}

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
export async function switchChain(
    chainId: bigint,
    ethereum: Eip1193Provider & { isTrust?: boolean },
    params?: AddEthereumChainParams,
) {
    try {
        await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: toQuantity(chainId) }],
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (switchError: any) {
        // Trust wallet error is localized string so can't catch them
        if (switchError.code === 4902 || ethereum.isTrust) {
            await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                    {
                        chainId: toQuantity(chainId),
                        chainName: params?.chainName || 'Ethereum',
                        nativeCurrency: {
                            name: params?.chainName || 'Ethereum',
                            symbol: params?.chainSymbol || 'ETH',
                            decimals: 18,
                        },
                        rpcUrls: params?.rpcUrl ? [params.rpcUrl] : [],
                        blockExplorerUrls: [params?.explorerUrl || 'https://etherscan.io'],
                    },
                ],
            });
        } else {
            throw switchError;
        }
    }
}

/**
 * A callback type for browser events.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type browserCallBack = (...args: any[]) => void;

/**
 * Extended `BrowserProviderOptions` including chain metadata and callbacks.
 */
export interface BrowserProviderOptionsExt
    extends BrowserProviderOptions, AddEthereumChainParams, ProxySignerOptions {
    chainChanged?: browserCallBack;
    accountsChanged?: browserCallBack;
    disconnect?: browserCallBack;
}

/**
 * A BrowserProvider supporting EIP-1193, EIP-6963, and with handy event/callback integration.
 * Also supports injection of an 'appProvider' for extra context.
 */
export class BrowserProvider extends ethBrowserProvider {
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
    constructor(
        ethereum: Eip1193Provider & EventEmitter,
        appProvider?: JsonRpcProvider,
        options?: BrowserProviderOptionsExt,
    ) {
        super(ethereum, appProvider?._network, options);

        this.ethereum = ethereum;
        this.appProvider = appProvider;
        this.options = options;

        this.chainChanged = options?.chainChanged;
        this.accountsChanged = options?.accountsChanged;
        this.disconnect = options?.disconnect;
    }

    /**
     * Returns a ProxySigner-wrapped JsonRpcSigner for the given address.
     * Handles chain switching automatically if required.
     * @param address Signer address to retrieve.
     * @returns Promise resolving to JsonRpcSigner instance.
     */
    async getSigner(address: string): Promise<JsonRpcSigner> {
        const [{ address: signerAddress }, signerChainId] = await Promise.all([
            super.getSigner(address),
            super.send('eth_chainId', []).then((c) => BigInt(c)),
        ]);

        const appChainId = this.appProvider?._network.chainId;

        if (appChainId && signerChainId !== appChainId) {
            await switchChain(appChainId, this.ethereum, this.options);
        }

        if (this.chainChanged) {
            this.ethereum.on('chainChanged', this.chainChanged);
        }

        if (this.accountsChanged) {
            this.ethereum.on('accountsChanged', this.accountsChanged);
        }

        if (this.disconnect) {
            this.ethereum.on('disconnect', this.disconnect);
        }

        return new ProxySigner(new JsonRpcSigner(this, signerAddress), {
            ...this.options,
            appProvider: this.options?.appProvider || this.appProvider,
        }) as unknown as JsonRpcSigner;
    }

    /**
     * Supports EIP-6963 discovery for browser wallet providers; returns matching BrowserProviders.
     * https://github.com/ethers-io/ethers.js/commit/f5469dd0e0719389d51e0106ee36d07a7ebef875
     * @param appProvider Optional backend provider.
     * @param options Optional options.
     * @returns Promise resolving to an array of detected BrowserProvider instances.
     */
    static discoverProviders(
        appProvider?: JsonRpcProvider,
        options?: BrowserProviderOptionsExt,
    ): Promise<BrowserProvider[]> {
        return new Promise((resolve) => {
            const found: Eip6963ProviderDetail[] = [];

            const listener = (event: unknown) => {
                found.push((event as Eip6963Announcement).detail);
            };

            setTimeout(() => {
                const providers: BrowserProvider[] = found.map(({ info: providerInfo, provider }) => {
                    return new BrowserProvider(provider, appProvider, {
                        ...options,
                        providerInfo,
                    });
                });

                window?.removeEventListener('eip6963:announceProvider', listener);

                resolve(providers);

                // Default to 300ms
            }, 300);

            window?.addEventListener('eip6963:announceProvider', listener);

            window?.dispatchEvent(new Event('eip6963:requestProvider'));
        });
    }
}
