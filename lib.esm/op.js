"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GAS_PRICE_ORACLE_ADDRESS = void 0;
exports.getL1Fee = getL1Fee;
const ethers_1 = require("./ethers");
const { Transaction, parseUnits, parseEther, ZeroAddress } = ethers_1.ethers;
/**
 * Address of the OP Stack L1 Gas Price Oracle on standard OP chains.
 */
exports.GAS_PRICE_ORACLE_ADDRESS = '0x420000000000000000000000000000000000000F';
/**
 * Calculate the L1 data/fee for an OP Stack transaction, using the onchain oracle contract.
 * @param oracle Instance of OpGasPriceOracle contract.
 * @param tx Optional: TransactionRequest to calculate the L1 fee for.
 * @returns Promise resolving to the L1 fee as a bigint.
 */
async function getL1Fee(oracle, tx) {
    const { unsignedSerialized } = Transaction.from({
        chainId: tx?.chainId || 10000n,
        data: tx?.data || '0x',
        gasLimit: tx?.gasLimit || 10_000_000,
        gasPrice: tx?.gasPrice || parseUnits('10000', 'gwei'),
        nonce: tx?.nonce || 100_000,
        to: tx?.to instanceof Promise ? (await tx?.to) : tx?.to || ZeroAddress,
        type: tx?.type || 0,
        value: tx?.value || parseEther('10000'),
    });
    return ((await oracle.getL1Fee(unsignedSerialized)) * 13n) / 10n;
}
