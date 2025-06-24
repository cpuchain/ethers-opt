import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers';
import { expect } from 'chai';
import { getSigners } from '../src/fixtures';
import { getL1Fee, OpGasPriceOracle__factory } from '../src';
import { OpGasPriceOracleMock__factory } from '../src/typechain-hardhat';

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
