import path from 'path';
import { readFile, writeFile, readdir } from 'fs/promises';

const replaceDir = 'src/typechain/factories';
const replaceFrom = 'import { Contract, Interface, type ContractRunner } from "ethers";';
const replaceTo = `import type { ContractRunner } from 'ethers';
import { ethers } from '../../ethers';
const { Contract, Interface } = ethers;`;

async function start() {
    const files = (await readdir(replaceDir)).map((file) => path.join(replaceDir, file));

    for (const file of files) {
        const context = await readFile(file, { encoding: 'utf8' });

        await writeFile(file, context.replace(replaceFrom, replaceTo));

        console.log(`Replaced ${file}`);
    }
}

start();
