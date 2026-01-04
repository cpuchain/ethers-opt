import type { BaseContract, Interface, Overrides } from 'ethers';
import type { Overrides as typeOverrides } from './typechain/common.js';
import type { Multicall } from './typechain/index.js';

export const MULTICALL_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';

/**
 * Minimal multicall configuration object for aggregate3 calls.
 */
export interface CallV3 {
    contract?: BaseContract;
    address?: string;
    interface?: Interface;
    name: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
export async function multicall(multi: Multicall, calls: CallV3[], overrides: Overrides = {}) {
    const calldata = calls.map(({ contract, address, interface: cInterface, name, params, allowFailure }) => {
        const target = (contract?.target || address) as string;
        const _interface = (contract?.interface || cInterface) as Interface;

        return {
            target,
            callData: _interface.encodeFunctionData(name, params),
            allowFailure: allowFailure ?? false,
        };
    });

    return (await multi.aggregate3.staticCall(calldata, overrides as typeOverrides<'view'>)).map(
        ([success, data], i) => {
            const { contract, interface: cInterface, name } = calls[i];

            const _interface = (contract?.interface || cInterface) as Interface;
            const _result = success && data !== '0x' ? _interface.decodeFunctionResult(name, data) : data;
            return Array.isArray(_result) && _result.length === 1 ? _result[0] : _result;
        },
    );
}
