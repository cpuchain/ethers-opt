"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ethers = void 0;
exports.getSigners = getSigners;
exports.hasCode = hasCode;
exports.deployERC20 = deployERC20;
exports.deployMulticall = deployMulticall;
// Should not be bundled for web, included only for common Hardhat testing purposes.
const promises_1 = require("fs/promises");
const path_1 = __importDefault(require("path"));
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const hardhat_1 = __importDefault(require("hardhat"));
const ethers_1 = require("ethers");
const src_1 = require("../../src");
const typechain_hardhat_1 = require("../typechain-hardhat");
/**
 * Returns the Hardhat ethers instance (extended with HardhatEthersHelpers).
 */
exports.ethers = hardhat_1.default.ethers;
/**
 * Get signers, optionally wrapped as ProxySigner with provided options.
 * Also deploys the Multicall contract if needed.
 * @param options ProxySigner configuration options.
 * @returns Promise resolving to an array of ProxySigners.
 */
async function getSigners(options) {
    const signers = src_1.ProxySigner.fromSigners(await exports.ethers.getSigners(), {
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
async function hasCode(signerOrProvider, address) {
    const provider = (signerOrProvider.provider || signerOrProvider);
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
async function deployERC20(signer, name = 'Token', symbol = 'TKN', decimals = 18, supply = 1_000_000) {
    const token = await new typechain_hardhat_1.ERC20Mock__factory(signer).deploy(name, symbol, decimals, (0, ethers_1.parseUnits)(String(supply), decimals));
    await token.waitForDeployment();
    return src_1.ERC20__factory.connect(token.target, signer);
}
/**
 * Deploys the Multicall contract if not already present.
 * Ensures the deployer account has enough funds.
 * @param signer The signer to use for deployment (and funding the deployer, if required).
 * @returns Promise resolving to deployed Multicall contract instance.
 */
async function deployMulticall(signer) {
    const provider = signer.provider;
    const codeExists = await hasCode(provider, src_1.MULTICALL_ADDRESS);
    if (codeExists) {
        return src_1.Multicall__factory.connect(src_1.MULTICALL_ADDRESS, signer);
    }
    const { gasPrice, gasLimit, signerAddress, transaction } = JSON.parse(await (0, promises_1.readFile)(path_1.default.join(__dirname, 'Multicall/deployment.json'), { encoding: 'utf8' }));
    const ethCost = BigInt(gasPrice) * BigInt(gasLimit);
    if ((await provider.getBalance(signerAddress)) < ethCost) {
        console.log(`Funding ${signerAddress} ${(0, ethers_1.formatEther)(ethCost)} ETH to deploy Multicall contract`);
        await (await signer.sendTransaction({ to: signerAddress, value: ethCost })).wait();
    }
    await (await provider.broadcastTransaction(transaction)).wait();
    return src_1.Multicall__factory.connect(src_1.MULTICALL_ADDRESS, signer);
}
