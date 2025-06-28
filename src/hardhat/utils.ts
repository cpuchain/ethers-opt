import { access, constants, stat } from 'fs/promises';

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
