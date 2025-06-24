"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BrowserProvider = void 0;
exports.switchChain = switchChain;
const ethers_1 = require("./ethers");
const signer_1 = require("./signer");
const { BrowserProvider: ethBrowserProvider, JsonRpcSigner: ethJsonRpcSigner, toQuantity } = ethers_1.ethers;
/**
 * Attempts to switch or add the given chain on the connected browser wallet.
 * @param chainId The target chain ID (bigint).
 * @param ethereum The browser EIP-1193 provider object.
 * @param params Optional parameters for chain addition.
 */
async function switchChain(chainId, ethereum, params) {
    try {
        await ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: toQuantity(chainId) }],
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    }
    catch (switchError) {
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
        }
        else {
            throw switchError;
        }
    }
}
/**
 * A BrowserProvider supporting EIP-1193, EIP-6963, and with handy event/callback integration.
 * Also supports injection of an 'appProvider' for extra context.
 */
class BrowserProvider extends ethBrowserProvider {
    ethereum;
    appProvider;
    options;
    chainChanged;
    accountsChanged;
    disconnect;
    /**
     * Create a new BrowserProvider instance.
     * @param ethereum The injected EIP-1193 provider.
     * @param appProvider Optional fallback/provider for network context.
     * @param options Additional options.
     */
    constructor(ethereum, appProvider, options) {
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
    async getSigner(address) {
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
        return new signer_1.ProxySigner(new ethJsonRpcSigner(this, signerAddress), {
            ...this.options,
            appProvider: this.options?.appProvider || this.appProvider,
        });
    }
    /**
     * Supports EIP-6963 discovery for browser wallet providers; returns matching BrowserProviders.
     * https://github.com/ethers-io/ethers.js/commit/f5469dd0e0719389d51e0106ee36d07a7ebef875
     * @param appProvider Optional backend provider.
     * @param options Optional options.
     * @returns Promise resolving to an array of detected BrowserProvider instances.
     */
    static discoverProviders(appProvider, options) {
        return new Promise((resolve) => {
            const found = [];
            const listener = (event) => {
                found.push(event.detail);
            };
            setTimeout(() => {
                const providers = found.map(({ info: providerInfo, provider }) => {
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
exports.BrowserProvider = BrowserProvider;
