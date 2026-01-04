import { access, constants, stat } from 'fs/promises';
import type { Signer, Provider } from 'ethers';

/**
 * Helper function to check if a directory is accessible and writable.
 * Returns true if access is allowed, false otherwise.
 */
export async function checkAccess(dir: string): Promise<boolean> {
    try {
        await access(dir, constants.W_OK);
        return true;
    } catch {
        return false;
    }
}

export async function existsAsync(fileOrDir: string): Promise<boolean> {
    try {
        await stat(fileOrDir);

        return true;
    } catch {
        return false;
    }
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
