import path from 'path';
import { rm, mkdir, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { task } from 'hardhat/config.js';
import { type HardhatRuntimeEnvironment } from 'hardhat/types/runtime.js';
import { checkAccess } from './utils.js';

export async function flattenAll(
    taskArgs?: { input?: string; output?: string },
    hre?: HardhatRuntimeEnvironment,
) {
    const input = taskArgs?.input || './contracts';
    const output = taskArgs?.output || './flatten';

    // Find all .sol files under the input directory recursively.
    const files = await glob(`${input}/**/*.sol`, { ignore: 'node_modules/**' });

    // Delete the output directory (recursively), ignoring any errors if it doesn't exist.
    await rm(output, { recursive: true, force: true });

    for (const file of files) {
        const { dir, base } = path.parse(file);

        // Compute the corresponding output path by replacing input dir with output dir in path.
        const destDir = dir.replace(path.parse(input).base, path.parse(output).base);
        const dest = path.join(destDir, base);

        // Make sure the destination directory exists, create if not accessible/writable.
        if (!(await checkAccess(destDir))) {
            await mkdir(destDir, { recursive: true });
        }

        try {
            // Use Hardhat's flatten functionality for the source file.
            const flatten = await hre?.run('flatten:get-flattened-sources', { files: [file] });

            // Write the flattened output to the deduced output path.
            await writeFile(dest, flatten);
            console.log(`flatten:all: ${dest}`);
        } catch (e) {
            // If flattening fails (e.g. due to circular dependencies), log the error.
            console.log(`flatten:all: error for ${dest} (likely circular)`);
            console.log(e);
        }
    }
}

/**
 * Hardhat Task: "flatten:all"
 * ---------------------------
 * Flattens all Solidity (.sol) files found under a specified contracts source directory,
 * then outputs the flattened versions into a parallel directory tree under a specified output directory.
 *
 * Usage:
 *   npx hardhat flatten:all --input ./contracts --output ./flatten
 *   (Both 'input' and 'output' parameters are optional. They default to './contracts' and './flatten'.)
 *
 * How it works:
 * 1. Gathers all contract source files recursively from the input directory using fast-glob.
 * 2. Deletes any existing output/flatten directory to prevent stale files.
 * 3. For each .sol file found:
 *    - Computes its intended path under the output directory, mirroring original structure.
 *    - Ensures its parent directories exist (creates them as necessary).
 *    - Runs the internal Hardhat 'flatten:get-flattened-sources' task to flatten the file and its dependencies.
 *    - Writes the flattened output to the target path.
 *    - Logs success or errors (typically circular dependencies if errors arise).
 *
 * This can be useful for contract verification (e.g. on Etherscan), auditing, or sharing minimal-file contracts,
 * as some platforms require flattened source files.
 */
task('flatten:all', 'Flatten all contracts under flatten directory')
    .addParam('input', 'Contract src (default to contracts)', './contracts')
    .addParam('output', 'Directory to save flatten contracts (default to flatten)', './flatten')
    .setAction(async (taskArgs, hre) => {
        await flattenAll(taskArgs, hre);
    });
