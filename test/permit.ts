import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { describe, expect, it } from 'vitest';
import { parseEther } from 'ethers';
import { deployERC20, getSigners } from '../src/hardhat/fixtures/index.js';
import { permit } from '../src/index.js';

describe('permit.ts', function () {
    const commonFixture = async () => {
        const [owner, bob] = await getSigners();

        const token = await deployERC20(owner);

        return { owner, bob, token };
    };

    it('produces a valid signature', async function () {
        const { bob, token } = await loadFixture(commonFixture);

        const sig = await permit(token, bob.address, 1n);

        expect(sig).to.have.property('v');
        expect(sig).to.have.property('r');
        expect(sig).to.have.property('s');
    });

    it('allows spender to use permit signature', async function () {
        const { owner, bob, token } = await loadFixture(commonFixture);

        const value = parseEther('10');
        const deadline = ((await owner.provider.getBlock('latest'))?.timestamp || 0) + 3600;

        const { v, r, s } = await permit(token, bob.address, value, deadline);

        await (await token.connect(bob).permit(owner.address, bob.address, value, deadline, v, r, s)).wait();

        /**
        await expect(token.connect(bob).permit(owner.address, bob.address, value, deadline, v, r, s))
            .to.emit(token, 'Approval')
            .withArgs(owner.address, bob.address, value);
        **/

        expect(await token.allowance(owner.address, bob.address)).to.equal(value);
    });
});
