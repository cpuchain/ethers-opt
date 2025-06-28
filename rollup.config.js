import { getRollupConfig } from '@cpuchain/rollup';

export const hhExternal = (id) => (/^(@[\w-]+\/)?[\w-]+$/.test(id) || id.startsWith('hardhat'));

const config = [
    getRollupConfig({ input: './src/index.ts' }),
    getRollupConfig({ 
        input: './src/index.ts',
        browserName: 'ethersOpt',
        globals: {
            ethers: 'ethers'
        },
        external: ['crypto', 'ethers'],
    }),
    getRollupConfig({ 
        input: './src/index.ts',
        browserName: 'ethersOpt',
        globals: {
            ethers: 'ethers'
        },
        external: ['crypto', 'ethers'],
        minify: true,
    }),
    getRollupConfig({ input: './src/hardhat/fixtures/index.ts', external: hhExternal }),
    getRollupConfig({ input: './src/hardhat/flatten.ts', external: hhExternal }),
    getRollupConfig({ input: './src/hardhat/remappings.ts', external: hhExternal }),
    getRollupConfig({ input: './src/hardhat/typefix.ts', external: hhExternal }),
    getRollupConfig({ input: './src/prover/index.ts' }),
]

export default config;

