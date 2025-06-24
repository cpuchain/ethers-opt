/**
 * https://www.alchemy.com/docs/how-to-build-a-gas-fee-estimator-using-eip-1559
 */
import type { FeeData } from 'ethers';
/**
 * Response from eth_feeHistory.
 */
export interface FeeHistoryResp {
    oldestBlock?: string;
    baseFeePerGas?: string[];
    gasUsedRatio?: number[];
    reward?: string[][];
    baseFeePerBlobGas?: string[];
    blobGasUsedRatio?: number[];
}
/**
 * Details for a single block from fee history.
 */
export interface FeeHistoryBlock {
    number: number | string;
    gasUsedRatio: number;
    baseFeePerGas: bigint;
    priorityFeePerGas: bigint[];
}
/**
 * Format of fee history, aggregated for analysis.
 */
export interface FormattedFeeHistory {
    blocks: FeeHistoryBlock[];
    baseFeePerGasAvg: bigint;
    priorityFeePerGasAvg: bigint[];
}
/**
 * Formats the `eth_feeHistory` response into an array of historical fee blocks,
 * and computes averages.
 * @param result Original response.
 * @param historicalBlocks How many blocks to include.
 * @param includePending Whether or not to add a 'pending' pseudo-block.
 * @returns Parsed fee history object with average calculations.
 */
export declare function formatFeeHistory(result: FeeHistoryResp, historicalBlocks: number, includePending?: boolean): FormattedFeeHistory;
/**
 * Computes a suitable gas price from FeeData for EIP1559 or legacy transactions.
 * @param feeData FeeData object as returned by Provider.
 * @returns The appropriate gas price.
 */
export declare function getGasPrice(feeData: FeeData): bigint;
