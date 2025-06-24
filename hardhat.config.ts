import process from 'process';
import { HardhatUserConfig } from 'hardhat/config';
import '@nomicfoundation/hardhat-toolbox';
import '@nomicfoundation/hardhat-ethers';
import 'hh-flatten';

const config: HardhatUserConfig = {
    defaultNetwork: 'hardhat',
    solidity: {
        compilers: [
            {
                version: '0.8.30',
                settings: {
                    evmVersion: 'london',
                    optimizer: {
                        enabled: true,
                        runs: 200,
                    },
                },
            },
        ],
    },
    networks: {
        develop: {
            url: process.env.RPC_URL || '',
            accounts: {
                mnemonic: process.env.MNEMONIC || 'test test test test test test test test test test test junk',
                initialIndex: Number(process.env.MNEMONIC_INDEX) || 0,
            },
        },
        hardhat: {},
    },
    typechain: {
        outDir: 'src/typechain-hardhat',
    }
};

export default config;
