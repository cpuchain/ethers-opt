import type { AbstractProvider, Provider } from 'ethers';
declare const ethEnsResolver: typeof import("ethers").EnsResolver;
/**
 * Optimized EnsResolver to support optimized Onchain / Offchain Resolvers within a single contract call if possible
 * Also supports Basenames
 * (Can also batch requests through Multicall3 if provider supports)
 */
export declare class EnsResolver extends ethEnsResolver {
    #private;
    /**
     * Overrides method to support both ENS & Basename
     */
    supportsWildcard(): Promise<boolean>;
    static getEnsAddress(provider: Provider): Promise<string>;
    static fromName(provider: AbstractProvider, name: string): Promise<null | EnsResolver>;
    static lookupAddress(provider: AbstractProvider, address: string, reverseCheck?: boolean): Promise<null | string>;
    /**
     * Method overrides to handle errors if name doesn't exist
     * (Error: could not decode result data ethers/src.ts/providers/ens-resolver.ts:249:30)
     * (Cannot be handled by checking if resolver address is null or result is '0x')
     * (Likely bug on #fetch from EnsResolver with return iface.decodeFunctionResult(fragment, result)[0];)
     */
    getAddress(coinType?: number): Promise<null | string>;
    getText(key: string): Promise<null | string>;
    getContentHash(): Promise<null | string>;
    getAvatar(): Promise<null | string>;
}
export {};
