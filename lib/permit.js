"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.permit = permit;
const ethers_1 = require("./ethers");
const { Signature: ethSignature, MaxUint256 } = ethers_1.ethers;
/**
 * Create an EIP-2612 permit signature for an ERC20 token from a signer.
 * @param erc20 ERC20 contract instance (with Permit support).
 * @param spenderOrSigner Address to approve allowance for (as string or SignerWithAddress).
 * @param value Maximum token amount to approve (default: MaxUint256).
 * @param deadline Permit signature deadline (default: MaxUint256, i.e. infinite).
 * @returns Promise resolving to an ethers Signature instance.
 */
async function permit(erc20, spenderOrSigner, value = MaxUint256, deadline = MaxUint256) {
    const token = erc20;
    const spender = (spenderOrSigner?.address || spenderOrSigner);
    const signer = token.runner;
    const [name, nonce, { chainId }] = await Promise.all([
        token.name(),
        token.nonces(signer.address),
        signer.provider.getNetwork(),
    ]);
    return ethSignature.from(await signer.signTypedData({
        name,
        version: '1',
        chainId,
        verifyingContract: token.target,
    }, {
        Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
        ],
    }, {
        owner: signer.address,
        spender,
        value,
        nonce,
        deadline,
    }));
}
