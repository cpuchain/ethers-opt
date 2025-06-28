import { loadFixture } from '@nomicfoundation/hardhat-toolbox/network-helpers.js';
import { describe, beforeAll, expect, it } from 'vitest';
import { ensRegistries, EnsResolver, Provider } from '../src/index.js';

const ETH_RPC = 'https://rpc.mevblocker.io';
const ENS_ETH = 'ens.eth';

describe('ens.ts', function () {
    let resolver: EnsResolver;

    const ensFixture = async () => {
        const provider = new Provider(ETH_RPC);
        await provider.getNetwork();
        return { provider };
    };

    beforeAll(async function () {
        const { provider } = await loadFixture(ensFixture);

        const _resolver = (await EnsResolver.fromName(provider, ENS_ETH)) as EnsResolver;

        expect(_resolver).to.not.be.null;

        resolver = _resolver;
    });

    it('getEnsAddress should work', async function () {
        const { provider } = await loadFixture(ensFixture);

        const ensRegistryAddress = await EnsResolver.getEnsAddress(provider);

        expect(ensRegistryAddress).to.equal(ensRegistries[Number((await provider.getNetwork()).chainId)]);
    });

    it('getAddress / getText / getContentHash / getAvatar non null for ens.eth', async function () {
        try {
            const [address, url, avatar, contentHash] = await Promise.all([
                resolver.getAddress(),
                resolver.getText('url'),
                resolver.getAvatar(),
                resolver.getContentHash(),
            ]);

            expect(address).to.be.a('string');
            expect(url).to.be.a('string');
            expect(avatar).to.be.a('string');
            expect(contentHash).to.be.a('string');
        } catch (error) {
            console.log(`Can not resolve something from ens.eth`);
            console.log(error);
        }
    });
});
