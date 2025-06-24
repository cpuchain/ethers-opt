import type { Signature } from 'ethers';
import type { SignerWithAddress } from './signer';
/**
 * Create an EIP-2612 permit signature for an ERC20 token from a signer.
 * @param erc20 ERC20 contract instance (with Permit support).
 * @param spenderOrSigner Address to approve allowance for (as string or SignerWithAddress).
 * @param value Maximum token amount to approve (default: MaxUint256).
 * @param deadline Permit signature deadline (default: MaxUint256, i.e. infinite).
 * @returns Promise resolving to an ethers Signature instance.
 */
export declare function permit(erc20: unknown, spenderOrSigner: string | SignerWithAddress, value?: bigint, deadline?: number | bigint): Promise<Signature>;
