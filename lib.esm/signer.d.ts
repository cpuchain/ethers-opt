import type { Signer, TransactionRequest, TransactionResponse, BlockTag, Provider, AuthorizationRequest, Authorization, TypedDataDomain, TypedDataField, TransactionLike, SigningKey } from 'ethers';
import { Provider as WProvider } from './provider';
import { OpGasPriceOracle } from './typechain';
export declare const HARDHAT_CHAIN = 31337n;
export declare const ARB_CHAIN = 42161n;
export declare const ARB_GAS_LIMIT = 5000000n;
export declare const DEFAULT_GAS_LIMIT = 500000n;
export declare const DEFAULT_GAS_PRICE_BUMP = 2;
export declare const DEFAULT_GAS_LIMIT_BUMP = 1.3;
export declare const GAS_LIMIT_FAILOVER = 2000000n;
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
export declare function populateTransaction(signer: SignerWithAddress, tx?: TransactionRequestWithFees): Promise<TransactionRequestWithFees>;
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
    appProvider?: Provider;
    opGasPriceOracle?: string;
    wrapProvider?: boolean;
    autoValue?: boolean;
    gasPriceBump?: feeMultiplier;
    gasLimitBump?: feeMultiplier;
    customPriorityFee?: customPriorityFee;
    gasLimitFailover?: boolean;
}
/**
 * A signer extended with address plus options.
 */
export interface SignerWithAddress extends Signer, Omit<ProxySignerOptions, 'wrapProvider' | 'opGasPriceOracle'> {
    address: string;
    opGasPriceOracle?: OpGasPriceOracle;
    isHardhat?: boolean;
}
/**
 * Proxies all Signer method calls to a parent Signer (Optionally binding to a "wrapped" provider).
 * Useful for auto-populating transactions, fast signer swapping, and enhanced test/dev experience.
 */
export declare class ProxySigner implements SignerWithAddress {
    #private;
    parentSigner: SignerWithAddress;
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
    constructor(parentSigner: SignerWithAddress, options?: ProxySignerOptions);
    /**
     * Returns the address this signer represents.
     * @returns Address string.
     */
    get address(): string;
    /**
     * Provider attached to this signer (possibly a wrapped WProvider).
     * @returns Provider instance.
     */
    get provider(): WProvider | Provider;
    /**
     * Creates an array of ProxySigners from an array of Signers. (like for hre.ethers.getSigners())
     * @param signers Array of SignerWithAddress.
     * @param options Optional proxy options to apply to all.
     */
    static fromSigners(signers: SignerWithAddress[], options?: ProxySignerOptions): ProxySigner[];
    /**
     * Returns a ProxySigner for a given address, attached to the given provider.
     * (e.g., for a read-only address).
     */
    static fromAddress(address: string, provider?: Provider, options?: ProxySignerOptions): ProxySigner;
    /** Returns ProxySigner using a private key. */
    static fromPrivateKey(privateKey: string | SigningKey, provider?: Provider, options?: ProxySignerOptions): ProxySigner;
    /** Returns ProxySigner using a BIP-39 mnemonic phrase. */
    static fromMnemonic(mnemonic: string, provider?: Provider, index?: number, options?: ProxySignerOptions): ProxySigner;
    populateTransaction(tx: TransactionRequest): Promise<TransactionLike<string>>;
    sendTransaction(tx: TransactionRequest): Promise<TransactionResponseWithFees>;
    /**
     * For convenience with JsonRpcSigner type
     */
    sendUncheckedTransaction(tx: TransactionRequest): Promise<string>;
    unlock(password: string): Promise<boolean>;
    _legacySignMessage(_message: string | Uint8Array): Promise<string>;
    /**
     * For the rest of methods proxy it
     */
    getAddress(): Promise<string>;
    connect(provider: null | Provider): Signer;
    getNonce(blockTag?: BlockTag): Promise<number>;
    populateCall(tx: TransactionRequest): Promise<TransactionLike<string>>;
    estimateGas(tx: TransactionRequest): Promise<bigint>;
    call(tx: TransactionRequest): Promise<string>;
    resolveName(name: string): Promise<null | string>;
    signTransaction(tx: TransactionRequest): Promise<string>;
    signMessage(message: string | Uint8Array): Promise<string>;
    signTypedData(domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any>): Promise<string>;
    populateAuthorization(auth: AuthorizationRequest): Promise<AuthorizationRequest>;
    authorize(authorization: AuthorizationRequest): Promise<Authorization>;
}
