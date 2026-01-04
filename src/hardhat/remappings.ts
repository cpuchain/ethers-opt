import { readFile } from 'fs/promises';
import { existsAsync } from './utils.js';

export async function getRemappings(): Promise<string[][] | undefined> {
    if (!(await existsAsync('remappings.txt'))) {
        return;
    }

    return (await readFile('remappings.txt', { encoding: 'utf8' }))
        .split('\n')
        .filter(Boolean)
        .map((l) => l.trim().split('='));
}

/**
 * Apply this to
 *
 * {
 *     preprocess: {
 *         eachLine: (hre: HardhatRuntimeEnvironment) => {
 *             return getRemappingsTransformerFunc();
 *         },
 *     },
 * },
 */
export async function getRemappingsTransformerFunc(): Promise<{ transform: (line: string) => string }> {
    const remappings = await getRemappings();

    const transform = (line: string) => {
        if (remappings && line.match(/^\s*import /i)) {
            remappings.forEach(([find, replace]) => {
                if (line.includes(find)) {
                    line = line.replace(find, replace);
                }
            });
        }
        return line;
    };

    return { transform };
}
