import { ContractFactory, ContractTransactionResponse } from "ethers";
import type { Signer, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../../../../common";
import type { SafeCast, SafeCastInterface } from "../../../../../@openzeppelin/contracts/utils/math/SafeCast";
type SafeCastConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class SafeCast__factory extends ContractFactory {
    constructor(...args: SafeCastConstructorParams);
    getDeployTransaction(overrides?: NonPayableOverrides & {
        from?: string;
    }): Promise<ContractDeployTransaction>;
    deploy(overrides?: NonPayableOverrides & {
        from?: string;
    }): Promise<SafeCast & {
        deploymentTransaction(): ContractTransactionResponse;
    }>;
    connect(runner: ContractRunner | null): SafeCast__factory;
    static readonly bytecode = "0x60566037600b82828239805160001a607314602a57634e487b7160e01b600052600060045260246000fd5b30600052607381538281f3fe73000000000000000000000000000000000000000030146080604052600080fdfea2646970667358221220f861929ac18da7ef8186fa4b696de0263164531791af50e87856c77ef9ce566d64736f6c634300081e0033";
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "uint8";
            readonly name: "bits";
            readonly type: "uint8";
        }, {
            readonly internalType: "int256";
            readonly name: "value";
            readonly type: "int256";
        }];
        readonly name: "SafeCastOverflowedIntDowncast";
        readonly type: "error";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "int256";
            readonly name: "value";
            readonly type: "int256";
        }];
        readonly name: "SafeCastOverflowedIntToUint";
        readonly type: "error";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint8";
            readonly name: "bits";
            readonly type: "uint8";
        }, {
            readonly internalType: "uint256";
            readonly name: "value";
            readonly type: "uint256";
        }];
        readonly name: "SafeCastOverflowedUintDowncast";
        readonly type: "error";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "value";
            readonly type: "uint256";
        }];
        readonly name: "SafeCastOverflowedUintToInt";
        readonly type: "error";
    }];
    static createInterface(): SafeCastInterface;
    static connect(address: string, runner?: ContractRunner | null): SafeCast;
}
export {};
