import { ContractFactory, ContractTransactionResponse } from "ethers";
import type { Signer, BigNumberish, ContractDeployTransaction, ContractRunner } from "ethers";
import type { NonPayableOverrides } from "../../common";
import type { OpGasPriceOracleMock, OpGasPriceOracleMockInterface } from "../../contracts/OpGasPriceOracleMock";
type OpGasPriceOracleMockConstructorParams = [signer?: Signer] | ConstructorParameters<typeof ContractFactory>;
export declare class OpGasPriceOracleMock__factory extends ContractFactory {
    constructor(...args: OpGasPriceOracleMockConstructorParams);
    getDeployTransaction(_multiplier: BigNumberish, overrides?: NonPayableOverrides & {
        from?: string;
    }): Promise<ContractDeployTransaction>;
    deploy(_multiplier: BigNumberish, overrides?: NonPayableOverrides & {
        from?: string;
    }): Promise<OpGasPriceOracleMock & {
        deploymentTransaction(): ContractTransactionResponse;
    }>;
    connect(runner: ContractRunner | null): OpGasPriceOracleMock__factory;
    static readonly bytecode = "0x60a0604052348015600f57600080fd5b5060405161024c38038061024c833981016040819052602c916033565b608052604b565b600060208284031215604457600080fd5b5051919050565b6080516101e161006b6000396000818160400152608601526101e16000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c80631b3ed7221461003b57806349948e0e14610074575b600080fd5b6100627f000000000000000000000000000000000000000000000000000000000000000081565b60405190815260200160405180910390f35b6100626100823660046100cd565b60007f000000000000000000000000000000000000000000000000000000000000000082516100b19190610186565b92915050565b634e487b7160e01b600052604160045260246000fd5b6000602082840312156100df57600080fd5b813567ffffffffffffffff8111156100f657600080fd5b8201601f8101841361010757600080fd5b803567ffffffffffffffff811115610121576101216100b7565b604051601f8201601f19908116603f0116810167ffffffffffffffff81118282101715610150576101506100b7565b60405281815282820160200186101561016857600080fd5b81602084016020830137600091810160200191909152949350505050565b80820281158282048414176100b157634e487b7160e01b600052601160045260246000fdfea2646970667358221220677e8ddc37ac65381ddda949e8b63dfd17ada540aaec9fda1c9674e68c4797eb64736f6c634300081e0033";
    static readonly abi: readonly [{
        readonly inputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "_multiplier";
            readonly type: "uint256";
        }];
        readonly stateMutability: "nonpayable";
        readonly type: "constructor";
    }, {
        readonly inputs: readonly [{
            readonly internalType: "bytes";
            readonly name: "_data";
            readonly type: "bytes";
        }];
        readonly name: "getL1Fee";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }, {
        readonly inputs: readonly [];
        readonly name: "multiplier";
        readonly outputs: readonly [{
            readonly internalType: "uint256";
            readonly name: "";
            readonly type: "uint256";
        }];
        readonly stateMutability: "view";
        readonly type: "function";
    }];
    static createInterface(): OpGasPriceOracleMockInterface;
    static connect(address: string, runner?: ContractRunner | null): OpGasPriceOracleMock;
}
export {};
