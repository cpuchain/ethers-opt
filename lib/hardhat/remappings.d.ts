export declare function getRemappings(): Promise<string[][] | undefined>;
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
export declare function getRemappingsTransformerFunc(): Promise<{
	transform: (line: string) => string;
}>;

export {};
