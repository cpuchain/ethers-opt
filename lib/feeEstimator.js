"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatFeeHistory = formatFeeHistory;
exports.getGasPrice = getGasPrice;
/**
 * Formats the `eth_feeHistory` response into an array of historical fee blocks,
 * and computes averages.
 * @param result Original response.
 * @param historicalBlocks How many blocks to include.
 * @param includePending Whether or not to add a 'pending' pseudo-block.
 * @returns Parsed fee history object with average calculations.
 */
function formatFeeHistory(result, historicalBlocks, includePending) {
    let blockNum = Number(result.oldestBlock ?? 0);
    let index = 0;
    const blocks = [];
    while (blockNum < Number(result.oldestBlock ?? 0) + historicalBlocks) {
        blocks.push({
            number: blockNum,
            gasUsedRatio: Number(result.gasUsedRatio?.[index] ?? 0),
            baseFeePerGas: BigInt(result.baseFeePerGas?.[index] ?? 0),
            priorityFeePerGas: result.reward?.[index]?.map((x) => BigInt(x)) || [],
        });
        blockNum++;
        index++;
    }
    if (includePending) {
        blocks.push({
            number: 'pending',
            gasUsedRatio: NaN,
            baseFeePerGas: BigInt(result.baseFeePerGas?.[historicalBlocks] ?? 0),
            priorityFeePerGas: [],
        });
    }
    const { baseFeePerGasAvg, priorityFeePerGasAvg } = blocks.reduce((acc, curr, index) => {
        acc.baseFeePerGasAvg += curr.baseFeePerGas;
        curr.priorityFeePerGas.forEach((gas, i) => {
            if (!acc.priorityFeePerGasAvg[i]) {
                acc.priorityFeePerGasAvg[i] = 0n;
            }
            if (gas) {
                acc.priorityFeePerGasAvg[i] += gas;
            }
        });
        if (blocks.length === index + 1) {
            acc.baseFeePerGasAvg = acc.baseFeePerGasAvg / BigInt(blocks.length);
            acc.priorityFeePerGasAvg = acc.priorityFeePerGasAvg.map((gas) => {
                return gas ? gas / BigInt(blocks.length) : 0n;
            });
        }
        return acc;
    }, {
        baseFeePerGasAvg: 0n,
        priorityFeePerGasAvg: [],
    });
    return {
        blocks,
        baseFeePerGasAvg,
        priorityFeePerGasAvg,
    };
}
/**
 * Computes a suitable gas price from FeeData for EIP1559 or legacy transactions.
 * @param feeData FeeData object as returned by Provider.
 * @returns The appropriate gas price.
 */
function getGasPrice(feeData) {
    if (feeData.maxFeePerGas) {
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 0n;
        const maxFeePerGas = feeData.maxFeePerGas <= maxPriorityFeePerGas ? maxPriorityFeePerGas + 10n : feeData.maxFeePerGas;
        return maxFeePerGas + maxPriorityFeePerGas;
    }
    return feeData.gasPrice || 0n;
}
