import {
    AbstractProvider,
    EnsPlugin,
    Provider,
    EnsResolver as ethEnsResolver,
    Contract,
    namehash,
    ZeroAddress,
    isError,
    getAddress,
    dnsEncode,
} from 'ethers';
import {
    ensRegistries,
    ensReverseNode,
    ensStaticResolvers,
    ensUniversalResolvers,
    wildcardResolvers,
} from './contracts.js';

/**
 * Optimized EnsResolver to support optimized Onchain / Offchain Resolvers within a single contract call if possible
 * Also supports Basenames
 * (Can also batch requests through Multicall3 if provider supports)
 */
export class EnsResolver extends ethEnsResolver {
    /**
     * Overrides method to support both ENS & Basename
     */
    async supportsWildcard(): Promise<boolean> {
        if (wildcardResolvers.has(this.address)) {
            return true;
        }
        return super.supportsWildcard();
    }

    static async getEnsAddress(provider: Provider): Promise<string> {
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);

        const ensPlugin = network.getPlugin<EnsPlugin>('org.ethers.plugins.network.Ens');
        const ensRegistryAddress = ensRegistries[chainId] || ensPlugin?.address;

        if (!ensRegistryAddress) {
            throw new Error(`Network ${chainId} doesn't have ENS registry address specified`);
        }

        return ensRegistryAddress;
    }

    static async #getResolver(provider: Provider, name: string, hash?: string): Promise<null | string> {
        const chainId = Number((await provider.getNetwork()).chainId);

        // Resolve to static resolvers if we have any
        if (ensStaticResolvers[chainId]) {
            return ensStaticResolvers[chainId];
        }

        // Following is imported from ethers.js (because calling parent class method is not possible)
        const ensAddr = await EnsResolver.getEnsAddress(provider);

        // eslint-disable-next-line no-useless-catch
        try {
            const contract = new Contract(
                ensAddr,
                ['function resolver(bytes32) view returns (address)'],
                provider,
            );

            const addr = await contract.resolver(hash || namehash(name || ''), {
                enableCcipRead: true,
            });

            if (addr === ZeroAddress) {
                return null;
            }
            return addr;
        } catch (error) {
            // ENS registry cannot throw errors on resolver(bytes32),
            // so probably a link error
            throw error;
        }
    }

    // Override method to fetch resolver from non private method
    static async fromName(provider: AbstractProvider, name: string): Promise<null | EnsResolver> {
        let currentName = name;
        while (true) {
            if (currentName === '' || currentName === '.') {
                return null;
            }

            // Optimization since the eth node cannot change and does
            // not have a wildcard resolver
            if (name !== 'eth' && currentName === 'eth') {
                return null;
            }

            // Check the current node for a resolver
            const addr = await EnsResolver.#getResolver(provider, currentName);

            // Found a resolver!
            if (addr != null) {
                const resolver = new EnsResolver(provider, addr, name);

                // Legacy resolver found, using EIP-2544 so it isn't safe to use
                if (currentName !== name && !(await resolver.supportsWildcard())) {
                    return null;
                }

                return resolver;
            }

            // Get the parent node
            currentName = currentName.split('.').slice(1).join('.');
        }
    }

    // Reverse name lookup ported from AbstractProvider
    static async lookupAddress(
        provider: AbstractProvider,
        address: string,
        reverseCheck = true,
    ): Promise<null | string> {
        try {
            address = getAddress(address);
            const chainId = Number((await provider.getNetwork()).chainId);

            const reverseName =
                address.substring(2).toLowerCase() + (ensReverseNode[chainId] || '.addr.reverse');
            const node = namehash(reverseName);

            const resolverAddress = await EnsResolver.#getResolver(provider, '', node);
            if (resolverAddress == null || resolverAddress === ZeroAddress) {
                return null;
            }

            const resolverContract = new Contract(
                resolverAddress,
                [
                    'function reverse(bytes) view returns (string memory, address, address, address)',
                    'function name(bytes32) view returns (string)',
                ],
                provider,
            );

            // Reverse method only works with ETH ENS resolver
            if (ensUniversalResolvers[chainId]) {
                const dnsNode = dnsEncode(reverseName);

                const [name, nameAddress] = await resolverContract.reverse(dnsNode);

                if (!name || nameAddress !== address) {
                    return null;
                }

                return name;
            }

            // Resolving name for classic resolvers
            const name = await resolverContract.name(node);

            if (!name) {
                return null;
            }

            if (reverseCheck) {
                const nameAddress = await provider.resolveName(name);

                if (nameAddress !== address) {
                    return null;
                }
            }

            return name;
        } catch (error) {
            // No data was returned from the resolver
            if (isError(error, 'BAD_DATA') && error.value === '0x') {
                return null;
            }

            // Something reerted
            if (isError(error, 'CALL_EXCEPTION')) {
                return null;
            }

            throw error;
        }
    }

    /**
     * Method overrides to handle errors if name doesn't exist
     * (Error: could not decode result data ethers/src.ts/providers/ens-resolver.ts:249:30)
     * (Cannot be handled by checking if resolver address is null or result is '0x')
     * (Likely bug on #fetch from EnsResolver with return iface.decodeFunctionResult(fragment, result)[0];)
     */
    async getAddress(coinType?: number): Promise<null | string> {
        try {
            return await super.getAddress(coinType);
        } catch (error) {
            if (isError(error, 'BAD_DATA') && error.value === '0x') {
                return null;
            }
            throw error;
        }
    }

    async getText(key: string): Promise<null | string> {
        try {
            return await super.getText(key);
        } catch (error) {
            if (isError(error, 'BAD_DATA') && error.value === '0x') {
                return null;
            }
            throw error;
        }
    }

    async getContentHash(): Promise<null | string> {
        try {
            return await super.getContentHash();
        } catch (error) {
            if (isError(error, 'BAD_DATA') && error.value === '0x') {
                return null;
            }
            throw error;
        }
    }

    async getAvatar(): Promise<null | string> {
        try {
            return await super.getAvatar();
        } catch (error) {
            if (isError(error, 'BAD_DATA') && error.value === '0x') {
                return null;
            }
            throw error;
        }
    }
}
