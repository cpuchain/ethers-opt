import type { TransactionRequest } from 'ethers';
import { OpGasPriceOracle } from './typechain';
/**
 * Address of the OP Stack L1 Gas Price Oracle on standard OP chains.
 */
export declare const GAS_PRICE_ORACLE_ADDRESS = "0x420000000000000000000000000000000000000F";
/**
 * Calculate the L1 data/fee for an OP Stack transaction, using the onchain oracle contract.
 * @param oracle Instance of OpGasPriceOracle contract.
 * @param tx Optional: TransactionRequest to calculate the L1 fee for.
 * @returns Promise resolving to the L1 fee as a bigint.
 */
export declare function getL1Fee(oracle: OpGasPriceOracle, tx?: TransactionRequest): Promise<bigint>;
