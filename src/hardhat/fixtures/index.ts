// Should not be bundled for web, included only for common Hardhat testing purposes.
import hre from 'hardhat';
import { ethers as _ethers, Signer, parseUnits } from 'ethers';
import { HardhatEthersHelpers } from '@nomicfoundation/hardhat-ethers/types/index.js';
import {
    ERC20,
    ERC20__factory,
    ProxySigner,
    ProxySignerOptions,
    SignerWithAddress,
    Provider as Provider2,
} from '../../index.js';
import { ERC20Mock__factory } from '../../typechain-hardhat/index.js';
import { deployMulticall } from './Multicall/index.js';

export * from '../utils.js';

const _getSigners = (hre as unknown as { ethers: typeof _ethers & HardhatEthersHelpers }).ethers.getSigners;

/**
 * Get signers, optionally wrapped as ProxySigner with provided options.
 * Also deploys the Multicall contract if needed.
 * @param options ProxySigner configuration options.
 * @returns Promise resolving to an array of ProxySigners.
 */
export async function getSigners(options?: ProxySignerOptions): Promise<ProxySigner[]> {
    const signers = ProxySigner.fromSigners((await _getSigners()) as unknown as SignerWithAddress[], {
        ...(options || {}),
        wrapProvider: true,
    });

    const owner = signers[0];
    const provider = owner.provider as Provider2;

    const multicallCount = Number(provider.multicallMaxCount);

    provider.multicallMaxCount = 0;

    await deployMulticall(owner);

    provider.multicallMaxCount = multicallCount;

    return signers;
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
