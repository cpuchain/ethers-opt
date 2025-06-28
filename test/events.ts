import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { describe, expect, it } from 'vitest';
import { deployERC20, getSigners } from '../src/hardhat/fixtures/index.js';
import { multiQueryFilter } from '../src/index.js';

describe('events.ts', function () {
    const commonFixture = async () => {
        const [owner] = await getSigners();

        const token = await deployERC20(owner);

        return { owner, token };
    };

    it('getEvents returns events (single contract)', async function () {
        const { token } = await loadFixture(commonFixture);

        const events = await multiQueryFilter({
            contract: token,
        });

        const event1 = events.find(({ address }) => address === (token.target as string));

        expect(events).to.be.a('array');
        expect(events.length).to.be.gte(1);
        expect(event1?.address).to.equal(token.target as string);
    });

    it('getEvents returns events (multi contract)', async function () {
        const { owner, token } = await loadFixture(commonFixture);
        const token2 = await deployERC20(owner);

        const events = await multiQueryFilter({
            address: [token.target as string, token2.target as string],
            contract: token,
        });

        const event1 = events.find(({ address }) => address === (token.target as string));
        const event2 = events.find(({ address }) => address === (token2.target as string));

        expect(events).to.be.a('array');
        expect(events.length).to.be.gte(2);
        expect(event1?.address).to.equal(token.target as string);
        expect(event2?.address).to.equal(token2.target as string);
    });
});
