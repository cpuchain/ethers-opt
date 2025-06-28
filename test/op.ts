import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { describe, expect, it } from 'vitest';
import { getSigners } from '../src/hardhat/fixtures/index.js';
import { getL1Fee, OpGasPriceOracle__factory } from '../src/index.js';
import { OpGasPriceOracleMock__factory } from '../src/typechain-hardhat/index.js';

describe('op.ts', function () {
    const commonFixture = async () => {
        const [owner] = await getSigners();

        const deployedOracle = await new OpGasPriceOracleMock__factory(owner).deploy(1);
        const opGasPriceOracle = OpGasPriceOracle__factory.connect(deployedOracle.target as string, owner);

        owner.opGasPriceOracle = opGasPriceOracle;

        return { owner, opGasPriceOracle };
    };

    it('computes L1 fee for dummy tx', async function () {
        const { opGasPriceOracle } = await loadFixture(commonFixture);

        const fee = await getL1Fee(opGasPriceOracle);

        expect(fee).to.be.a('bigint');
    });
});
