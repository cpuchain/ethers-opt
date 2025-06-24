import type { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types';
import { type ethers as _ethers, Signer, Provider } from 'ethers';
import { ERC20, Multicall, ProxySigner, ProxySignerOptions } from '../../src';
/**
 * Represents a deployment artifact (commonly for contract deployments).
 *
 * Inspired by @safe-global/safe-singleton-factory/artifacts/${chainId}/deployment.json
 */
export interface Deployment {
    gasPrice: number;
    gasLimit: number;
    signerAddress: string;
    transaction: string;
    address: string;
}
/**
 * Returns the Hardhat ethers instance (extended with HardhatEthersHelpers).
 */
export declare const ethers: typeof _ethers & HardhatEthersHelpers;
/**
 * Get signers, optionally wrapped as ProxySigner with provided options.
 * Also deploys the Multicall contract if needed.
 * @param options ProxySigner configuration options.
 * @returns Promise resolving to an array of ProxySigners.
 */
export declare function getSigners(options?: ProxySignerOptions): Promise<ProxySigner[]>;
/**
 * Checks whether a contract exists at a given address.
 * @param signerOrProvider The signer or provider to use for the check.
 * @param address Address to query.
 * @returns Promise resolving to true if code is present, false otherwise.
 */
export declare function hasCode(signerOrProvider: Signer | Provider, address: string): Promise<boolean>;
/**
 * Deploys a mock ERC20 contract for testing.
 * @param signer Signer to use for deployment.
 * @param name Token name.
 * @param symbol Token symbol.
 * @param decimals Number of decimals.
 * @param supply Initial supply.
 * @returns Promise resolving to an ERC20 instance.
 */
export declare function deployERC20(signer: Signer, name?: string, symbol?: string, decimals?: number, supply?: string | number): Promise<ERC20>;
/**
 * Deploys the Multicall contract if not already present.
 * Ensures the deployer account has enough funds.
 * @param signer The signer to use for deployment (and funding the deployer, if required).
 * @returns Promise resolving to deployed Multicall contract instance.
 */
export declare function deployMulticall(signer: Signer): Promise<Multicall>;
