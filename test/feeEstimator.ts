import { describe, expect, it } from 'vitest';
import { formatFeeHistory } from '../src/index.js';

describe('feeEstimator.ts', function () {
    it('correctly formats fee history', function () {
        const result = {
            oldestBlock: '1',
            baseFeePerGas: ['10', '20', '30'],
            gasUsedRatio: [0.5, 1, 0.9],
            reward: [
                ['1', '2'],
                ['3', '4'],
                ['5', '6'],
            ],
        };
        const history = formatFeeHistory(result, 3);
        expect(history.blocks).to.have.length('3');
        expect(history.baseFeePerGasAvg).to.be.a('bigint');
    });
});
