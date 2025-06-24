import type { BaseContract, Interface, Overrides } from 'ethers';
import type { Multicall } from './typechain';
export declare const MULTICALL_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
/**
 * Minimal multicall configuration object for aggregate3 calls.
 */
export interface CallV3 {
    contract?: BaseContract;
    address?: string;
    interface?: Interface;
    name: string;
    params?: any[];
    allowFailure?: boolean;
}
/**
 * Minimal fork of @pancakeswap/multicall
 * Calls the Multicall aggregate3 staticCall with an array of calls, returning results in order.
 * Use for batch contract calls with or without specific block tags/overrides.
 * @param multi Multicall contract instance.
 * @param calls Array of CallV3 objects.
 * @param overrides (Optional) Call overrides.
 * @returns Array of results: decoded if possible, else raw data.
 */
export declare function multicall(multi: Multicall, calls: CallV3[], overrides?: Overrides): Promise<any[]>;
