// Should not be bundled for web, included only for common Hardhat testing purposes.
import { readFile } from 'fs/promises';
import path from 'path';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import hre from 'hardhat';
import type { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types';
import { type ethers as _ethers, Signer, parseUnits, Provider, formatEther } from 'ethers';
import {
    ERC20,
    ERC20__factory,
    Multicall,
    Multicall__factory,
    MULTICALL_ADDRESS,
    ProxySigner,
    ProxySignerOptions,
} from '../../src';
import { ERC20Mock__factory } from '../typechain-hardhat';

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
export const { ethers } = hre as unknown as { ethers: typeof _ethers & HardhatEthersHelpers };

/**
 * Get signers, optionally wrapped as ProxySigner with provided options.
 * Also deploys the Multicall contract if needed.
 * @param options ProxySigner configuration options.
 * @returns Promise resolving to an array of ProxySigners.
 */
export async function getSigners(options?: ProxySignerOptions): Promise<ProxySigner[]> {
    const signers = ProxySigner.fromSigners(await ethers.getSigners(), {
        ...(options || {}),
        wrapProvider: true,
    });

    await deployMulticall(signers[0]);

    return signers;
}

/**
 * Checks whether a contract exists at a given address.
 * @param signerOrProvider The signer or provider to use for the check.
 * @param address Address to query.
 * @returns Promise resolving to true if code is present, false otherwise.
 */
export async function hasCode(signerOrProvider: Signer | Provider, address: string): Promise<boolean> {
    const provider = (signerOrProvider.provider || signerOrProvider) as Provider;

    const code = await provider.getCode(address);

    return code && code !== '0x' ? true : false;
}

/**
 * Deploys a mock ERC20 contract for testing.
 * @param signer Signer to use for deployment.
 * @param name Token name.
 * @param symbol Token symbol.
 * @param decimals Number of decimals.
 * @param supply Initial supply.
 * @returns Promise resolving to an ERC20 instance.
 */
export async function deployERC20(
    signer: Signer,
    name = 'Token',
    symbol = 'TKN',
    decimals = 18,
    supply: string | number = 1_000_000,
): Promise<ERC20> {
    const token = await new ERC20Mock__factory(signer).deploy(
        name,
        symbol,
        decimals,
        parseUnits(String(supply), decimals),
    );
    await token.waitForDeployment();

    return ERC20__factory.connect(token.target as string, signer);
}

/**
 * Deploys the Multicall contract if not already present.
 * Ensures the deployer account has enough funds.
 * @param signer The signer to use for deployment (and funding the deployer, if required).
 * @returns Promise resolving to deployed Multicall contract instance.
 */
export async function deployMulticall(signer: Signer): Promise<Multicall> {
    const provider = signer.provider as Provider;

    const codeExists = await hasCode(provider, MULTICALL_ADDRESS);

    if (codeExists) {
        return Multicall__factory.connect(MULTICALL_ADDRESS, signer);
    }

    const { gasPrice, gasLimit, signerAddress, transaction } = JSON.parse(
        await readFile(path.join(__dirname, 'Multicall/deployment.json'), { encoding: 'utf8' }),
    ) as Deployment;

    const ethCost = BigInt(gasPrice) * BigInt(gasLimit);

    if ((await provider.getBalance(signerAddress)) < ethCost) {
        console.log(`Funding ${signerAddress} ${formatEther(ethCost)} ETH to deploy Multicall contract`);
        await (await signer.sendTransaction({ to: signerAddress, value: ethCost })).wait();
    }

    await (await provider.broadcastTransaction(transaction)).wait();

    return Multicall__factory.connect(MULTICALL_ADDRESS, signer);
}
