import {
    Signer,
    TransactionRequest,
    TransactionResponse,
    BlockTag,
    Provider,
    AuthorizationRequest,
    Authorization,
    TypedDataDomain,
    TypedDataField,
    TransactionLike,
    JsonRpcApiProvider,
    JsonRpcSigner,
    SigningKey,
    resolveProperties,
    HDNodeWallet,
    Wallet,
    VoidSigner,
} from 'ethers';
import { ProviderOptions, Provider as WProvider } from './provider.js';
import { Multicall, OpGasPriceOracle, OpGasPriceOracle__factory } from './typechain/index.js';
import { getL1Fee } from './op.js';

export const HARDHAT_CHAIN = 31337n;

// For value calculation
export const ARB_CHAIN = 42161n;
export const ARB_GAS_LIMIT = 5_000_000n;
export const DEFAULT_GAS_LIMIT = 500_000n;

// For bumps
export const DEFAULT_GAS_PRICE_BUMP = 2;
export const DEFAULT_GAS_LIMIT_BUMP = 1.3;

// For failover
export const GAS_LIMIT_FAILOVER = 2_000_000n;

/**
 * Transaction options with possible additional L1 fee or total cost info.
 */
export interface TransactionRequestWithFees extends TransactionRequest {
    l1Fee?: bigint;
    txCost?: bigint;
}

/**
 * Transaction response with possible additional fee info.
 */
export interface TransactionResponseWithFees extends TransactionResponse {
    l1Fee?: bigint;
    txCost?: bigint;
}

/**
 * Fills in missing fields (gas, nonce, fees, value, etc.) for a transaction.
 * Also supports auto-calculation of max value for EOA or contract txs.
 * @param signer A ProxySigner instance.
 * @param tx A transaction request (possibly incomplete).
 * @returns Fully populated TransactionRequestWithFees.
 */
export async function populateTransaction(
    signer: SignerWithAddress,
    tx: TransactionRequestWithFees = {},
): Promise<TransactionRequestWithFees> {
    const provider = (signer.appProvider || signer.provider) as Provider & {
        multicall?: Multicall;
        multicallMaxCount?: number;
    };
    const providerHasMulticall = provider.multicall && Boolean(provider.multicallMaxCount);
    const signerAddress = signer.address || (await signer.getAddress());

    const gasPriceBump = (await signer.gasPriceBump?.()) || DEFAULT_GAS_PRICE_BUMP;
    const gasLimitBump = (await signer.gasLimitBump?.()) || DEFAULT_GAS_LIMIT_BUMP;
    const customPriorityFee = await signer.customPriorityFee?.();

    if (!tx.from) {
        tx.from = signerAddress;
    } else if (tx.from !== signerAddress) {
        throw new Error('Wrong signer for transaction');
    }

    const [chainId, feeData, nonce, balance, l1Fee] = await Promise.all([
        tx.chainId ? undefined : provider.getNetwork().then(({ chainId }) => chainId),
        typeof tx.maxFeePerGas === 'bigint' || typeof tx.gasPrice === 'bigint'
            ? undefined
            : provider.getFeeData(),
        typeof tx.nonce === 'number' ? undefined : provider.getTransactionCount(signerAddress, 'pending'),
        typeof tx.txCost === 'bigint' || !signer.autoValue || !providerHasMulticall
            ? undefined
            : (provider as WProvider).multicall.getEthBalance(signerAddress),
        tx.l1Fee || !signer.opGasPriceOracle ? 0n : getL1Fee(signer.opGasPriceOracle, tx),
    ]);

    if (typeof chainId === 'bigint') {
        tx.chainId = chainId;
    }

    let gasPrice = 0n;

    if (feeData) {
        if (feeData.maxFeePerGas) {
            if (!tx.type) {
                tx.type = 2;
            }

            const maxPriorityFeePerGas =
                typeof tx.maxPriorityFeePerGas === 'bigint'
                    ? (tx.maxPriorityFeePerGas as bigint)
                    : (customPriorityFee ?? (feeData.maxPriorityFeePerGas || 0n));
            const maxFeePerGas =
                feeData.maxFeePerGas <= maxPriorityFeePerGas
                    ? maxPriorityFeePerGas + 10n
                    : feeData.maxFeePerGas;

            tx.maxFeePerGas = BigInt(Math.floor(Number(maxFeePerGas) * gasPriceBump));
            tx.maxPriorityFeePerGas = maxPriorityFeePerGas;
            delete tx.gasPrice;

            gasPrice = tx.maxFeePerGas + (tx.maxPriorityFeePerGas as bigint);
        } else if (typeof feeData.gasPrice === 'bigint') {
            if (!tx.type && tx.type !== 0) {
                tx.type = 0;
            }
            tx.gasPrice = feeData.gasPrice;
            delete tx.maxFeePerGas;
            delete tx.maxPriorityFeePerGas;

            gasPrice = tx.gasPrice;
        }
    } else {
        gasPrice = tx.maxFeePerGas
            ? BigInt(tx.maxFeePerGas) + BigInt(tx.maxPriorityFeePerGas || 0n)
            : BigInt(tx.gasPrice || 0n);
    }

    if (!(chainId === HARDHAT_CHAIN && signer.isHardhat) && typeof nonce === 'number') {
        tx.nonce = nonce;
    }

    if (balance && BigInt(tx.value || 0) >= balance) {
        if (tx.chainId === ARB_CHAIN) {
            tx.value = balance - (gasPrice * ARB_GAS_LIMIT + l1Fee);
        } else {
            tx.value = balance - (gasPrice * DEFAULT_GAS_LIMIT + l1Fee);
        }

        const gasLimit = await provider.estimateGas(tx);

        tx.gasLimit = gasLimit !== 21000n ? BigInt(Math.floor(Number(gasLimit) * gasLimitBump)) : gasLimit;
        tx.value = balance - (gasPrice * (tx.gasLimit as bigint) + l1Fee);
    }

    if (!tx.gasLimit) {
        try {
            const gasLimit = await provider.estimateGas(tx);

            tx.gasLimit =
                gasLimit !== 21000n ? BigInt(Math.floor(Number(gasLimit) * gasLimitBump)) : gasLimit;
        } catch (error) {
            if (signer.gasLimitFailover) {
                tx.gasLimit = GAS_LIMIT_FAILOVER;
            } else {
                throw error;
            }
        }
    }

    if (l1Fee) {
        tx.l1Fee = l1Fee;
    }

    if (!tx.txCost) {
        tx.txCost = gasPrice * BigInt(tx.gasLimit) + l1Fee;
    }

    return resolveProperties(tx);
}

/**
 * Multiplier function to adjust gas price or gas limit for bumping.
 */
export type feeMultiplier = () => Promise<number> | number;

/** Custom function for priority fee per gas. */
export type customPriorityFee = () => Promise<bigint> | bigint;

/**
 * ProxySigner option bag.
 */
export interface ProxySignerOptions {
    // only necessary for JsonRpcSigner for better tx population
    appProvider?: Provider;
    opGasPriceOracle?: string;
    wrapProvider?: boolean;
    wrapProviderOptions?: ProviderOptions;

    autoValue?: boolean;
    gasPriceBump?: feeMultiplier;
    gasLimitBump?: feeMultiplier;
    customPriorityFee?: customPriorityFee;
    gasLimitFailover?: boolean;
}

/**
 * A signer extended with address plus options.
 */
export interface SignerWithAddress
    extends Signer, Omit<ProxySignerOptions, 'wrapProvider' | 'opGasPriceOracle'> {
    address: string;
    opGasPriceOracle?: OpGasPriceOracle;
    isHardhat?: boolean;
}

/**
 * Proxies all Signer method calls to a parent Signer (Optionally binding to a "wrapped" provider).
 * Useful for auto-populating transactions, fast signer swapping, and enhanced test/dev experience.
 */
export class ProxySigner implements SignerWithAddress {
    parentSigner: SignerWithAddress;
    #wrappedProvider?: WProvider;
    isHardhat?: boolean;

    appProvider?: Provider;
    opGasPriceOracle?: OpGasPriceOracle;

    autoValue: boolean;
    gasPriceBump?: feeMultiplier;
    gasLimitBump?: feeMultiplier;
    customPriorityFee?: customPriorityFee;
    gasLimitFailover: boolean;

    /**
     * Instantiates a ProxySigner from a parent Signer.
     * @param parentSigner The underlying Signer.
     * @param options Additional options.
     */
    constructor(parentSigner: SignerWithAddress, options?: ProxySignerOptions) {
        this.parentSigner = parentSigner;

        this.appProvider = options?.appProvider;
        this.opGasPriceOracle = options?.opGasPriceOracle
            ? OpGasPriceOracle__factory.connect(options.opGasPriceOracle, this.appProvider || this.provider)
            : undefined;

        // For hardhat with usual cases you should use WProvider -> Signer -> ProxySigner
        if (options?.wrapProvider && parentSigner.provider) {
            this.#wrappedProvider = new WProvider(undefined, undefined, {
                ...(options?.wrapProviderOptions || {}),
                hardhatProvider: parentSigner.provider,
            });
            this.isHardhat = (parentSigner.provider as { _networkName?: string })._networkName === 'hardhat';
        }

        this.autoValue = options?.autoValue || false;
        this.gasPriceBump = options?.gasPriceBump;
        this.gasLimitBump = options?.gasLimitBump;
        this.customPriorityFee = options?.customPriorityFee;
        this.gasLimitFailover = options?.gasLimitFailover ?? false;
    }

    /**
     * Returns the address this signer represents.
     * @returns Address string.
     */
    get address() {
        return this.parentSigner.address;
    }

    /**
     * Provider attached to this signer (possibly a wrapped WProvider).
     * @returns Provider instance.
     */
    get provider(): WProvider | Provider {
        return this.#wrappedProvider || (this.parentSigner.provider as Provider);
    }

    /**
     * Creates an array of ProxySigners from an array of Signers. (like for hre.ethers.getSigners())
     * @param signers Array of SignerWithAddress.
     * @param options Optional proxy options to apply to all.
     */
    static fromSigners(signers: SignerWithAddress[], options?: ProxySignerOptions) {
        return signers.map((s) => new ProxySigner(s, options));
    }

    /**
     * Returns a ProxySigner for a given address, attached to the given provider.
     * (e.g., for a read-only address).
     */
    static fromAddress(address: string, provider?: Provider, options?: ProxySignerOptions): ProxySigner {
        return new ProxySigner(new VoidSigner(address, provider), options);
    }

    /** Returns ProxySigner using a private key. */
    static fromPrivateKey(
        privateKey: string | SigningKey,
        provider?: Provider,
        options?: ProxySignerOptions,
    ): ProxySigner {
        return new ProxySigner(new Wallet(privateKey, provider), options);
    }

    /** Returns ProxySigner using a BIP-39 mnemonic phrase. */
    static fromMnemonic(
        mnemonic: string,
        provider?: Provider,
        index = 0,
        options?: ProxySignerOptions,
    ): ProxySigner {
        const defaultPath = `m/44'/60'/0'/0/${index}`;
        const { privateKey } = HDNodeWallet.fromPhrase(mnemonic, undefined, defaultPath);
        return ProxySigner.fromPrivateKey(privateKey, provider, options);
    }

    async populateTransaction(tx: TransactionRequest): Promise<TransactionLike<string>> {
        return (await populateTransaction(this, tx)) as TransactionLike<string>;
    }

    async sendTransaction(tx: TransactionRequest): Promise<TransactionResponseWithFees> {
        const txObj = await populateTransaction(this, tx);
        const sentTx = (await this.parentSigner.sendTransaction(txObj)) as TransactionResponseWithFees;
        if (txObj.txCost) {
            sentTx.txCost = txObj.txCost;
        }
        if (txObj.l1Fee) {
            sentTx.l1Fee = txObj.l1Fee;
        }
        return sentTx;
    }

    /**
     * For convenience with JsonRpcSigner type
     */
    async sendUncheckedTransaction(tx: TransactionRequest): Promise<string> {
        return (this.parentSigner as JsonRpcSigner).sendUncheckedTransaction(
            await populateTransaction(this, tx),
        );
    }

    async unlock(password: string): Promise<boolean> {
        return (this.provider as JsonRpcApiProvider).send('personal_unlockAccount', [
            this.address.toLowerCase(),
            password,
            null,
        ]);
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async _legacySignMessage(_message: string | Uint8Array): Promise<string> {
        throw new Error('Unimplemented for security reasons');
    }

    /**
     * For the rest of methods proxy it
     */
    // Addressable
    getAddress(): Promise<string> {
        return this.parentSigner.getAddress();
    }

    // Set provider
    connect(provider: null | Provider): Signer {
        // Usually would return a new ProxySigner with new parent, but
        // for standard behavior, we delegate the connect
        const connected = this.parentSigner.connect(provider);
        return new ProxySigner(connected as SignerWithAddress);
    }

    // State
    getNonce(blockTag?: BlockTag): Promise<number> {
        return this.parentSigner.getNonce(blockTag);
    }

    // Preparation
    populateCall(tx: TransactionRequest): Promise<TransactionLike<string>> {
        return this.parentSigner.populateCall(tx);
    }

    // Execution
    estimateGas(tx: TransactionRequest): Promise<bigint> {
        return this.parentSigner.estimateGas(tx);
    }

    call(tx: TransactionRequest): Promise<string> {
        if (this.#wrappedProvider) {
            return this.#wrappedProvider.call(tx);
        }
        return this.parentSigner.call(tx);
    }

    resolveName(name: string): Promise<null | string> {
        if (this.#wrappedProvider) {
            return this.#wrappedProvider.resolveName(name);
        }
        return this.parentSigner.resolveName(name);
    }

    // Signing
    signTransaction(tx: TransactionRequest): Promise<string> {
        return this.parentSigner.signTransaction(tx);
    }

    signMessage(message: string | Uint8Array): Promise<string> {
        return this.parentSigner.signMessage(message);
    }

    signTypedData(
        domain: TypedDataDomain,
        types: Record<string, TypedDataField[]>,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        value: Record<string, any>,
    ): Promise<string> {
        return this.parentSigner.signTypedData(domain, types, value);
    }

    populateAuthorization(auth: AuthorizationRequest): Promise<AuthorizationRequest> {
        return this.parentSigner.populateAuthorization(auth);
    }

    authorize(authorization: AuthorizationRequest): Promise<Authorization> {
        return this.parentSigner.authorize(authorization);
    }
}
