/**
 * Overrides hardhat compile task along with adding flatten:all and typechain:fix task as well
 */
import { TASK_COMPILE } from 'hardhat/builtin-tasks/task-names.js';
import { extendConfig, task } from 'hardhat/config.js';
import { flattenAll } from './flatten.js';
import { typechainFix } from './typefix.js';

export interface EthersOptUserConfigEntry {
    flattenAll?: boolean;
    flattenInput?: string;
    flattenOutput?: string;

    typechainFix?: boolean;
    typechainOutput?: string;
}

const DEFAULT_ETHERS_OPT_CONFIG: EthersOptUserConfigEntry = {
    flattenAll: false,
    typechainFix: false,
};

declare module 'hardhat/types/config.js' {
    interface HardhatUserConfig {
        ethersOpt?: EthersOptUserConfigEntry | EthersOptUserConfigEntry[];
    }

    interface HardhatConfig {
        ethersOpt: EthersOptUserConfigEntry[];
    }
}

extendConfig((config, userConfig) => {
    config.ethersOpt = [userConfig.ethersOpt].flat().map((el) => {
        const conf = Object.assign({}, DEFAULT_ETHERS_OPT_CONFIG, el);

        return conf as EthersOptUserConfigEntry;
    });
});

task(TASK_COMPILE).setAction(async (args, hre, runSuper) => {
    await runSuper();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(hre as any).__SOLIDITY_COVERAGE_RUNNING) {
        const configs = hre.config.ethersOpt;

        await Promise.all(
            configs.map(async (config) => {
                if (config.flattenAll) {
                    await flattenAll(
                        {
                            input: config.flattenInput,
                            output: config.flattenOutput,
                        },
                        hre,
                    );
                }

                if (config.typechainFix) {
                    await typechainFix(
                        {
                            dir: config.typechainOutput,
                        },
                        hre,
                    );
                }
            }),
        );
    }
});
