"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProxySigner = exports.GAS_LIMIT_FAILOVER = exports.DEFAULT_GAS_LIMIT_BUMP = exports.DEFAULT_GAS_PRICE_BUMP = exports.DEFAULT_GAS_LIMIT = exports.ARB_GAS_LIMIT = exports.ARB_CHAIN = exports.HARDHAT_CHAIN = void 0;
exports.populateTransaction = populateTransaction;
const ethers_1 = require("./ethers");
const provider_1 = require("./provider");
const typechain_1 = require("./typechain");
const op_1 = require("./op");
const { resolveProperties, JsonRpcSigner: ethJsonRpcSigner, HDNodeWallet, Wallet, VoidSigner } = ethers_1.ethers;
exports.HARDHAT_CHAIN = 31337n;
// For value calculation
exports.ARB_CHAIN = 42161n;
exports.ARB_GAS_LIMIT = 5000000n;
exports.DEFAULT_GAS_LIMIT = 500000n;
// For bumps
exports.DEFAULT_GAS_PRICE_BUMP = 2;
exports.DEFAULT_GAS_LIMIT_BUMP = 1.3;
// For failover
exports.GAS_LIMIT_FAILOVER = 2000000n;
/**
 * Fills in missing fields (gas, nonce, fees, value, etc.) for a transaction.
 * Also supports auto-calculation of max value for EOA or contract txs.
 * @param signer A ProxySigner instance.
 * @param tx A transaction request (possibly incomplete).
 * @returns Fully populated TransactionRequestWithFees.
 */
async function populateTransaction(signer, tx = {}) {
    const provider = (signer.appProvider || signer.provider);
    const signerAddress = signer.address || (await signer.getAddress());
    const gasPriceBump = (await signer.gasPriceBump?.()) || exports.DEFAULT_GAS_PRICE_BUMP;
    const gasLimitBump = (await signer.gasLimitBump?.()) || exports.DEFAULT_GAS_LIMIT_BUMP;
    const customPriorityFee = await signer.customPriorityFee?.();
    if (!tx.from) {
        tx.from = signerAddress;
    }
    else if (tx.from !== signerAddress) {
        throw new Error('Wrong signer for transaction');
    }
    const [chainId, feeData, nonce, balance, l1Fee] = await Promise.all([
        tx.chainId ? undefined : provider.getNetwork().then(({ chainId }) => chainId),
        typeof tx.maxFeePerGas === 'bigint' || typeof tx.gasPrice === 'bigint'
            ? undefined
            : provider.getFeeData(),
        typeof tx.nonce === 'number' ? undefined : provider.getTransactionCount(signerAddress, 'pending'),
        typeof tx.txCost === 'bigint' || !signer.autoValue
            ? undefined
            : (provider.multicall?.getEthBalance || provider.getBalance)(signerAddress),
        tx.l1Fee || !signer.opGasPriceOracle ? 0n : (0, op_1.getL1Fee)(signer.opGasPriceOracle, tx),
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
            const maxPriorityFeePerGas = typeof tx.maxPriorityFeePerGas === 'bigint'
                ? tx.maxPriorityFeePerGas
                : (customPriorityFee ?? (feeData.maxPriorityFeePerGas || 0n));
            const maxFeePerGas = feeData.maxFeePerGas <= maxPriorityFeePerGas
                ? maxPriorityFeePerGas + 10n
                : feeData.maxFeePerGas;
            tx.maxFeePerGas = BigInt(Math.floor(Number(maxFeePerGas) * gasPriceBump));
            tx.maxPriorityFeePerGas = maxPriorityFeePerGas;
            delete tx.gasPrice;
            gasPrice = tx.maxFeePerGas + tx.maxPriorityFeePerGas;
        }
        else if (typeof feeData.gasPrice === 'bigint') {
            if (!tx.type && tx.type !== 0) {
                tx.type = 0;
            }
            tx.gasPrice = feeData.gasPrice;
            delete tx.maxFeePerGas;
            delete tx.maxPriorityFeePerGas;
            gasPrice = tx.gasPrice;
        }
    }
    else {
        gasPrice = tx.maxFeePerGas
            ? BigInt(tx.maxFeePerGas) + BigInt(tx.maxPriorityFeePerGas || 0n)
            : BigInt(tx.gasPrice || 0n);
    }
    if (!(chainId === exports.HARDHAT_CHAIN && signer.isHardhat) && typeof nonce === 'number') {
        tx.nonce = nonce;
    }
    if (balance && BigInt(tx.value || 0) >= balance) {
        if (tx.chainId === exports.ARB_CHAIN) {
            tx.value = balance - (gasPrice * exports.ARB_GAS_LIMIT + l1Fee);
        }
        else {
            tx.value = balance - (gasPrice * exports.DEFAULT_GAS_LIMIT + l1Fee);
        }
        const gasLimit = await provider.estimateGas(tx);
        tx.gasLimit = gasLimit !== 21000n ? BigInt(Math.floor(Number(gasLimit) * gasLimitBump)) : gasLimit;
        tx.value = balance - (gasPrice * tx.gasLimit + l1Fee);
    }
    if (!tx.gasLimit) {
        try {
            const gasLimit = await provider.estimateGas(tx);
            tx.gasLimit =
                gasLimit !== 21000n ? BigInt(Math.floor(Number(gasLimit) * gasLimitBump)) : gasLimit;
        }
        catch (error) {
            if (signer.gasLimitFailover) {
                tx.gasLimit = exports.GAS_LIMIT_FAILOVER;
            }
            else {
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
 * Proxies all Signer method calls to a parent Signer (Optionally binding to a "wrapped" provider).
 * Useful for auto-populating transactions, fast signer swapping, and enhanced test/dev experience.
 */
class ProxySigner {
    parentSigner;
    #wrappedProvider;
    isHardhat;
    appProvider;
    opGasPriceOracle;
    autoValue;
    gasPriceBump;
    gasLimitBump;
    customPriorityFee;
    gasLimitFailover;
    /**
     * Instantiates a ProxySigner from a parent Signer.
     * @param parentSigner The underlying Signer.
     * @param options Additional options.
     */
    constructor(parentSigner, options) {
        this.parentSigner = parentSigner;
        this.appProvider = options?.appProvider;
        this.opGasPriceOracle = options?.opGasPriceOracle
            ? typechain_1.OpGasPriceOracle__factory.connect(options.opGasPriceOracle, this.appProvider || this.provider)
            : undefined;
        // For hardhat with usual cases you should use WProvider -> Signer -> ProxySigner
        if (options?.wrapProvider && parentSigner.provider) {
            this.#wrappedProvider = new provider_1.Provider(undefined, undefined, {
                hardhatProvider: parentSigner.provider,
            });
            this.isHardhat = parentSigner.provider._networkName === 'hardhat';
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
    get provider() {
        return this.#wrappedProvider || this.parentSigner.provider;
    }
    /**
     * Creates an array of ProxySigners from an array of Signers. (like for hre.ethers.getSigners())
     * @param signers Array of SignerWithAddress.
     * @param options Optional proxy options to apply to all.
     */
    static fromSigners(signers, options) {
        return signers.map((s) => new ProxySigner(s, options));
    }
    /**
     * Returns a ProxySigner for a given address, attached to the given provider.
     * (e.g., for a read-only address).
     */
    static fromAddress(address, provider, options) {
        return new ProxySigner(new VoidSigner(address, provider), options);
    }
    /** Returns ProxySigner using a private key. */
    static fromPrivateKey(privateKey, provider, options) {
        return new ProxySigner(new Wallet(privateKey, provider), options);
    }
    /** Returns ProxySigner using a BIP-39 mnemonic phrase. */
    static fromMnemonic(mnemonic, provider, index = 0, options) {
        const defaultPath = `m/44'/60'/0'/0/${index}`;
        const { privateKey } = HDNodeWallet.fromPhrase(mnemonic, undefined, defaultPath);
        return ProxySigner.fromPrivateKey(privateKey, provider, options);
    }
    async populateTransaction(tx) {
        return (await populateTransaction(this, tx));
    }
    async sendTransaction(tx) {
        if (this.parentSigner instanceof ethJsonRpcSigner || this.#wrappedProvider) {
            const txObj = await populateTransaction(this, tx);
            const sentTx = (await this.parentSigner.sendTransaction(txObj));
            if (txObj.txCost) {
                sentTx.txCost = txObj.txCost;
            }
            if (txObj.l1Fee) {
                sentTx.l1Fee = txObj.l1Fee;
            }
            return sentTx;
        }
        return this.parentSigner.sendTransaction(tx);
    }
    /**
     * For convenience with JsonRpcSigner type
     */
    async sendUncheckedTransaction(tx) {
        return this.parentSigner.sendUncheckedTransaction(await populateTransaction(this, tx));
    }
    async unlock(password) {
        return this.provider.send('personal_unlockAccount', [
            this.address.toLowerCase(),
            password,
            null,
        ]);
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    async _legacySignMessage(_message) {
        throw new Error('Unimplemented for security reasons');
    }
    /**
     * For the rest of methods proxy it
     */
    // Addressable
    getAddress() {
        return this.parentSigner.getAddress();
    }
    // Set provider
    connect(provider) {
        // Usually would return a new ProxySigner with new parent, but
        // for standard behavior, we delegate the connect
        const connected = this.parentSigner.connect(provider);
        return new ProxySigner(connected);
    }
    // State
    getNonce(blockTag) {
        return this.parentSigner.getNonce(blockTag);
    }
    // Preparation
    populateCall(tx) {
        return this.parentSigner.populateCall(tx);
    }
    // Execution
    estimateGas(tx) {
        return this.parentSigner.estimateGas(tx);
    }
    call(tx) {
        if (this.#wrappedProvider) {
            return this.#wrappedProvider.call(tx);
        }
        return this.parentSigner.call(tx);
    }
    resolveName(name) {
        if (this.#wrappedProvider) {
            return this.#wrappedProvider.resolveName(name);
        }
        return this.parentSigner.resolveName(name);
    }
    // Signing
    signTransaction(tx) {
        return this.parentSigner.signTransaction(tx);
    }
    signMessage(message) {
        return this.parentSigner.signMessage(message);
    }
    signTypedData(domain, types, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value) {
        return this.parentSigner.signTypedData(domain, types, value);
    }
    populateAuthorization(auth) {
        return this.parentSigner.populateAuthorization(auth);
    }
    authorize(authorization) {
        return this.parentSigner.authorize(authorization);
    }
}
exports.ProxySigner = ProxySigner;
