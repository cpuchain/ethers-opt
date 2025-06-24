import tseslint from 'typescript-eslint';
import { getConfig } from '@cpuchain/eslint';

const defaultConfig = getConfig();

const tsConfigIndex = defaultConfig.findIndex(c => c?.files?.[0]?.includes('*.ts'));

const tsConfig = defaultConfig[tsConfigIndex];

if (tsConfig?.rules && !tsConfig.rules['@typescript-eslint/ban-tslint-comment']) {
    defaultConfig[tsConfigIndex].rules['@typescript-eslint/ban-tslint-comment'] = ['off'];
}

export default tseslint.config(defaultConfig);
