import { Signature, MaxUint256, Provider } from 'ethers';
import type { ERC20 } from './typechain/index.js';
import type { SignerWithAddress } from './signer.js';

/**
 * Create an EIP-2612 permit signature for an ERC20 token from a signer.
 * @param erc20 ERC20 contract instance (with Permit support).
 * @param spenderOrSigner Address to approve allowance for (as string or SignerWithAddress).
 * @param value Maximum token amount to approve (default: MaxUint256).
 * @param deadline Permit signature deadline (default: MaxUint256, i.e. infinite).
 * @returns Promise resolving to an ethers Signature instance.
 */
export async function permit(
    erc20: unknown,
    spenderOrSigner: string | SignerWithAddress,
    value: bigint = MaxUint256,
    deadline: number | bigint = MaxUint256,
): Promise<Signature> {
    const token = erc20 as ERC20;
    const spender = ((spenderOrSigner as SignerWithAddress)?.address || spenderOrSigner) as string;
    const signer = token.runner as SignerWithAddress;

    const [name, nonce, { chainId }] = await Promise.all([
        token.name(),
        token.nonces(signer.address),
        (signer.provider as Provider).getNetwork(),
    ]);

    return Signature.from(
        await signer.signTypedData(
            {
                name,
                version: '1',
                chainId,
                verifyingContract: token.target as string,
            },
            {
                Permit: [
                    { name: 'owner', type: 'address' },
                    { name: 'spender', type: 'address' },
                    { name: 'value', type: 'uint256' },
                    { name: 'nonce', type: 'uint256' },
                    { name: 'deadline', type: 'uint256' },
                ],
            },
            {
                owner: signer.address,
                spender,
                value,
                nonce,
                deadline,
            },
        ),
    );
}
