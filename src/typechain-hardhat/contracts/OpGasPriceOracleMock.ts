/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedListener,
  TypedContractMethod,
} from "../common.js";

export interface OpGasPriceOracleMockInterface extends Interface {
  getFunction(nameOrSignature: "getL1Fee" | "multiplier"): FunctionFragment;

  encodeFunctionData(functionFragment: "getL1Fee", values: [BytesLike]): string;
  encodeFunctionData(
    functionFragment: "multiplier",
    values?: undefined
  ): string;

  decodeFunctionResult(functionFragment: "getL1Fee", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "multiplier", data: BytesLike): Result;
}

export interface OpGasPriceOracleMock extends BaseContract {
  connect(runner?: ContractRunner | null): OpGasPriceOracleMock;
  waitForDeployment(): Promise<this>;

  interface: OpGasPriceOracleMockInterface;

  queryFilter<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;
  queryFilter<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    fromBlockOrBlockhash?: string | number | undefined,
    toBlock?: string | number | undefined
  ): Promise<Array<TypedEventLog<TCEvent>>>;

  on<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  on<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  once<TCEvent extends TypedContractEvent>(
    event: TCEvent,
    listener: TypedListener<TCEvent>
  ): Promise<this>;
  once<TCEvent extends TypedContractEvent>(
    filter: TypedDeferredTopicFilter<TCEvent>,
    listener: TypedListener<TCEvent>
  ): Promise<this>;

  listeners<TCEvent extends TypedContractEvent>(
    event: TCEvent
  ): Promise<Array<TypedListener<TCEvent>>>;
  listeners(eventName?: string): Promise<Array<Listener>>;
  removeAllListeners<TCEvent extends TypedContractEvent>(
    event?: TCEvent
  ): Promise<this>;

  getL1Fee: TypedContractMethod<[_data: BytesLike], [bigint], "view">;

  multiplier: TypedContractMethod<[], [bigint], "view">;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "getL1Fee"
  ): TypedContractMethod<[_data: BytesLike], [bigint], "view">;
  getFunction(
    nameOrSignature: "multiplier"
  ): TypedContractMethod<[], [bigint], "view">;

  filters: {};
}
