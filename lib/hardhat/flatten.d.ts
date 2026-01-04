import { HardhatRuntimeEnvironment } from 'hardhat/types/runtime.js';

export declare function flattenAll(taskArgs?: {
	input?: string;
	output?: string;
}, hre?: HardhatRuntimeEnvironment): Promise<void>;

export {};
