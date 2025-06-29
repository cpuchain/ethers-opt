/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */
import type {
  BaseContract,
  BigNumberish,
  BytesLike,
  FunctionFragment,
  Result,
  Interface,
  EventFragment,
  AddressLike,
  ContractRunner,
  ContractMethod,
  Listener,
} from "ethers";
import type {
  TypedContractEvent,
  TypedDeferredTopicFilter,
  TypedEventLog,
  TypedLogDescription,
  TypedListener,
  TypedContractMethod,
} from "./common.js";

export declare namespace IAllowanceTransfer {
  export type TokenSpenderPairStruct = {
    token: AddressLike;
    spender: AddressLike;
  };

  export type TokenSpenderPairStructOutput = [
    token: string,
    spender: string
  ] & { token: string; spender: string };

  export type PermitDetailsStruct = {
    token: AddressLike;
    amount: BigNumberish;
    expiration: BigNumberish;
    nonce: BigNumberish;
  };

  export type PermitDetailsStructOutput = [
    token: string,
    amount: bigint,
    expiration: bigint,
    nonce: bigint
  ] & { token: string; amount: bigint; expiration: bigint; nonce: bigint };

  export type PermitBatchStruct = {
    details: IAllowanceTransfer.PermitDetailsStruct[];
    spender: AddressLike;
    sigDeadline: BigNumberish;
  };

  export type PermitBatchStructOutput = [
    details: IAllowanceTransfer.PermitDetailsStructOutput[],
    spender: string,
    sigDeadline: bigint
  ] & {
    details: IAllowanceTransfer.PermitDetailsStructOutput[];
    spender: string;
    sigDeadline: bigint;
  };

  export type PermitSingleStruct = {
    details: IAllowanceTransfer.PermitDetailsStruct;
    spender: AddressLike;
    sigDeadline: BigNumberish;
  };

  export type PermitSingleStructOutput = [
    details: IAllowanceTransfer.PermitDetailsStructOutput,
    spender: string,
    sigDeadline: bigint
  ] & {
    details: IAllowanceTransfer.PermitDetailsStructOutput;
    spender: string;
    sigDeadline: bigint;
  };

  export type AllowanceTransferDetailsStruct = {
    from: AddressLike;
    to: AddressLike;
    amount: BigNumberish;
    token: AddressLike;
  };

  export type AllowanceTransferDetailsStructOutput = [
    from: string,
    to: string,
    amount: bigint,
    token: string
  ] & { from: string; to: string; amount: bigint; token: string };
}

export declare namespace ISignatureTransfer {
  export type TokenPermissionsStruct = {
    token: AddressLike;
    amount: BigNumberish;
  };

  export type TokenPermissionsStructOutput = [token: string, amount: bigint] & {
    token: string;
    amount: bigint;
  };

  export type PermitTransferFromStruct = {
    permitted: ISignatureTransfer.TokenPermissionsStruct;
    nonce: BigNumberish;
    deadline: BigNumberish;
  };

  export type PermitTransferFromStructOutput = [
    permitted: ISignatureTransfer.TokenPermissionsStructOutput,
    nonce: bigint,
    deadline: bigint
  ] & {
    permitted: ISignatureTransfer.TokenPermissionsStructOutput;
    nonce: bigint;
    deadline: bigint;
  };

  export type SignatureTransferDetailsStruct = {
    to: AddressLike;
    requestedAmount: BigNumberish;
  };

  export type SignatureTransferDetailsStructOutput = [
    to: string,
    requestedAmount: bigint
  ] & { to: string; requestedAmount: bigint };

  export type PermitBatchTransferFromStruct = {
    permitted: ISignatureTransfer.TokenPermissionsStruct[];
    nonce: BigNumberish;
    deadline: BigNumberish;
  };

  export type PermitBatchTransferFromStructOutput = [
    permitted: ISignatureTransfer.TokenPermissionsStructOutput[],
    nonce: bigint,
    deadline: bigint
  ] & {
    permitted: ISignatureTransfer.TokenPermissionsStructOutput[];
    nonce: bigint;
    deadline: bigint;
  };
}

export interface Permit2Interface extends Interface {
  getFunction(
    nameOrSignature:
      | "DOMAIN_SEPARATOR"
      | "allowance"
      | "approve"
      | "invalidateNonces"
      | "invalidateUnorderedNonces"
      | "lockdown"
      | "nonceBitmap"
      | "permit(address,((address,uint160,uint48,uint48)[],address,uint256),bytes)"
      | "permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)"
      | "permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)"
      | "permitTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes)"
      | "permitWitnessTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes32,string,bytes)"
      | "permitWitnessTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes32,string,bytes)"
      | "transferFrom((address,address,uint160,address)[])"
      | "transferFrom(address,address,uint160,address)"
  ): FunctionFragment;

  getEvent(
    nameOrSignatureOrTopic:
      | "Approval"
      | "Lockdown"
      | "NonceInvalidation"
      | "Permit"
      | "UnorderedNonceInvalidation"
  ): EventFragment;

  encodeFunctionData(
    functionFragment: "DOMAIN_SEPARATOR",
    values?: undefined
  ): string;
  encodeFunctionData(
    functionFragment: "allowance",
    values: [AddressLike, AddressLike, AddressLike]
  ): string;
  encodeFunctionData(
    functionFragment: "approve",
    values: [AddressLike, AddressLike, BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "invalidateNonces",
    values: [AddressLike, AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "invalidateUnorderedNonces",
    values: [BigNumberish, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "lockdown",
    values: [IAllowanceTransfer.TokenSpenderPairStruct[]]
  ): string;
  encodeFunctionData(
    functionFragment: "nonceBitmap",
    values: [AddressLike, BigNumberish]
  ): string;
  encodeFunctionData(
    functionFragment: "permit(address,((address,uint160,uint48,uint48)[],address,uint256),bytes)",
    values: [AddressLike, IAllowanceTransfer.PermitBatchStruct, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)",
    values: [AddressLike, IAllowanceTransfer.PermitSingleStruct, BytesLike]
  ): string;
  encodeFunctionData(
    functionFragment: "permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)",
    values: [
      ISignatureTransfer.PermitTransferFromStruct,
      ISignatureTransfer.SignatureTransferDetailsStruct,
      AddressLike,
      BytesLike
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "permitTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes)",
    values: [
      ISignatureTransfer.PermitBatchTransferFromStruct,
      ISignatureTransfer.SignatureTransferDetailsStruct[],
      AddressLike,
      BytesLike
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "permitWitnessTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes32,string,bytes)",
    values: [
      ISignatureTransfer.PermitTransferFromStruct,
      ISignatureTransfer.SignatureTransferDetailsStruct,
      AddressLike,
      BytesLike,
      string,
      BytesLike
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "permitWitnessTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes32,string,bytes)",
    values: [
      ISignatureTransfer.PermitBatchTransferFromStruct,
      ISignatureTransfer.SignatureTransferDetailsStruct[],
      AddressLike,
      BytesLike,
      string,
      BytesLike
    ]
  ): string;
  encodeFunctionData(
    functionFragment: "transferFrom((address,address,uint160,address)[])",
    values: [IAllowanceTransfer.AllowanceTransferDetailsStruct[]]
  ): string;
  encodeFunctionData(
    functionFragment: "transferFrom(address,address,uint160,address)",
    values: [AddressLike, AddressLike, BigNumberish, AddressLike]
  ): string;

  decodeFunctionResult(
    functionFragment: "DOMAIN_SEPARATOR",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "allowance", data: BytesLike): Result;
  decodeFunctionResult(functionFragment: "approve", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "invalidateNonces",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "invalidateUnorderedNonces",
    data: BytesLike
  ): Result;
  decodeFunctionResult(functionFragment: "lockdown", data: BytesLike): Result;
  decodeFunctionResult(
    functionFragment: "nonceBitmap",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "permit(address,((address,uint160,uint48,uint48)[],address,uint256),bytes)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "permitTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "permitWitnessTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes32,string,bytes)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "permitWitnessTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes32,string,bytes)",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferFrom((address,address,uint160,address)[])",
    data: BytesLike
  ): Result;
  decodeFunctionResult(
    functionFragment: "transferFrom(address,address,uint160,address)",
    data: BytesLike
  ): Result;
}

export namespace ApprovalEvent {
  export type InputTuple = [
    owner: AddressLike,
    token: AddressLike,
    spender: AddressLike,
    amount: BigNumberish,
    expiration: BigNumberish
  ];
  export type OutputTuple = [
    owner: string,
    token: string,
    spender: string,
    amount: bigint,
    expiration: bigint
  ];
  export interface OutputObject {
    owner: string;
    token: string;
    spender: string;
    amount: bigint;
    expiration: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace LockdownEvent {
  export type InputTuple = [
    owner: AddressLike,
    token: AddressLike,
    spender: AddressLike
  ];
  export type OutputTuple = [owner: string, token: string, spender: string];
  export interface OutputObject {
    owner: string;
    token: string;
    spender: string;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace NonceInvalidationEvent {
  export type InputTuple = [
    owner: AddressLike,
    token: AddressLike,
    spender: AddressLike,
    newNonce: BigNumberish,
    oldNonce: BigNumberish
  ];
  export type OutputTuple = [
    owner: string,
    token: string,
    spender: string,
    newNonce: bigint,
    oldNonce: bigint
  ];
  export interface OutputObject {
    owner: string;
    token: string;
    spender: string;
    newNonce: bigint;
    oldNonce: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace PermitEvent {
  export type InputTuple = [
    owner: AddressLike,
    token: AddressLike,
    spender: AddressLike,
    amount: BigNumberish,
    expiration: BigNumberish,
    nonce: BigNumberish
  ];
  export type OutputTuple = [
    owner: string,
    token: string,
    spender: string,
    amount: bigint,
    expiration: bigint,
    nonce: bigint
  ];
  export interface OutputObject {
    owner: string;
    token: string;
    spender: string;
    amount: bigint;
    expiration: bigint;
    nonce: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export namespace UnorderedNonceInvalidationEvent {
  export type InputTuple = [
    owner: AddressLike,
    word: BigNumberish,
    mask: BigNumberish
  ];
  export type OutputTuple = [owner: string, word: bigint, mask: bigint];
  export interface OutputObject {
    owner: string;
    word: bigint;
    mask: bigint;
  }
  export type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
  export type Filter = TypedDeferredTopicFilter<Event>;
  export type Log = TypedEventLog<Event>;
  export type LogDescription = TypedLogDescription<Event>;
}

export interface Permit2 extends BaseContract {
  connect(runner?: ContractRunner | null): Permit2;
  waitForDeployment(): Promise<this>;

  interface: Permit2Interface;

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

  DOMAIN_SEPARATOR: TypedContractMethod<[], [string], "view">;

  allowance: TypedContractMethod<
    [arg0: AddressLike, arg1: AddressLike, arg2: AddressLike],
    [
      [bigint, bigint, bigint] & {
        amount: bigint;
        expiration: bigint;
        nonce: bigint;
      }
    ],
    "view"
  >;

  approve: TypedContractMethod<
    [
      token: AddressLike,
      spender: AddressLike,
      amount: BigNumberish,
      expiration: BigNumberish
    ],
    [void],
    "nonpayable"
  >;

  invalidateNonces: TypedContractMethod<
    [token: AddressLike, spender: AddressLike, newNonce: BigNumberish],
    [void],
    "nonpayable"
  >;

  invalidateUnorderedNonces: TypedContractMethod<
    [wordPos: BigNumberish, mask: BigNumberish],
    [void],
    "nonpayable"
  >;

  lockdown: TypedContractMethod<
    [approvals: IAllowanceTransfer.TokenSpenderPairStruct[]],
    [void],
    "nonpayable"
  >;

  nonceBitmap: TypedContractMethod<
    [arg0: AddressLike, arg1: BigNumberish],
    [bigint],
    "view"
  >;

  "permit(address,((address,uint160,uint48,uint48)[],address,uint256),bytes)": TypedContractMethod<
    [
      owner: AddressLike,
      permitBatch: IAllowanceTransfer.PermitBatchStruct,
      signature: BytesLike
    ],
    [void],
    "nonpayable"
  >;

  "permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)": TypedContractMethod<
    [
      owner: AddressLike,
      permitSingle: IAllowanceTransfer.PermitSingleStruct,
      signature: BytesLike
    ],
    [void],
    "nonpayable"
  >;

  "permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)": TypedContractMethod<
    [
      permit: ISignatureTransfer.PermitTransferFromStruct,
      transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct,
      owner: AddressLike,
      signature: BytesLike
    ],
    [void],
    "nonpayable"
  >;

  "permitTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes)": TypedContractMethod<
    [
      permit: ISignatureTransfer.PermitBatchTransferFromStruct,
      transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct[],
      owner: AddressLike,
      signature: BytesLike
    ],
    [void],
    "nonpayable"
  >;

  "permitWitnessTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes32,string,bytes)": TypedContractMethod<
    [
      permit: ISignatureTransfer.PermitTransferFromStruct,
      transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct,
      owner: AddressLike,
      witness: BytesLike,
      witnessTypeString: string,
      signature: BytesLike
    ],
    [void],
    "nonpayable"
  >;

  "permitWitnessTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes32,string,bytes)": TypedContractMethod<
    [
      permit: ISignatureTransfer.PermitBatchTransferFromStruct,
      transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct[],
      owner: AddressLike,
      witness: BytesLike,
      witnessTypeString: string,
      signature: BytesLike
    ],
    [void],
    "nonpayable"
  >;

  "transferFrom((address,address,uint160,address)[])": TypedContractMethod<
    [transferDetails: IAllowanceTransfer.AllowanceTransferDetailsStruct[]],
    [void],
    "nonpayable"
  >;

  "transferFrom(address,address,uint160,address)": TypedContractMethod<
    [
      from: AddressLike,
      to: AddressLike,
      amount: BigNumberish,
      token: AddressLike
    ],
    [void],
    "nonpayable"
  >;

  getFunction<T extends ContractMethod = ContractMethod>(
    key: string | FunctionFragment
  ): T;

  getFunction(
    nameOrSignature: "DOMAIN_SEPARATOR"
  ): TypedContractMethod<[], [string], "view">;
  getFunction(
    nameOrSignature: "allowance"
  ): TypedContractMethod<
    [arg0: AddressLike, arg1: AddressLike, arg2: AddressLike],
    [
      [bigint, bigint, bigint] & {
        amount: bigint;
        expiration: bigint;
        nonce: bigint;
      }
    ],
    "view"
  >;
  getFunction(
    nameOrSignature: "approve"
  ): TypedContractMethod<
    [
      token: AddressLike,
      spender: AddressLike,
      amount: BigNumberish,
      expiration: BigNumberish
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "invalidateNonces"
  ): TypedContractMethod<
    [token: AddressLike, spender: AddressLike, newNonce: BigNumberish],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "invalidateUnorderedNonces"
  ): TypedContractMethod<
    [wordPos: BigNumberish, mask: BigNumberish],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "lockdown"
  ): TypedContractMethod<
    [approvals: IAllowanceTransfer.TokenSpenderPairStruct[]],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "nonceBitmap"
  ): TypedContractMethod<
    [arg0: AddressLike, arg1: BigNumberish],
    [bigint],
    "view"
  >;
  getFunction(
    nameOrSignature: "permit(address,((address,uint160,uint48,uint48)[],address,uint256),bytes)"
  ): TypedContractMethod<
    [
      owner: AddressLike,
      permitBatch: IAllowanceTransfer.PermitBatchStruct,
      signature: BytesLike
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)"
  ): TypedContractMethod<
    [
      owner: AddressLike,
      permitSingle: IAllowanceTransfer.PermitSingleStruct,
      signature: BytesLike
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)"
  ): TypedContractMethod<
    [
      permit: ISignatureTransfer.PermitTransferFromStruct,
      transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct,
      owner: AddressLike,
      signature: BytesLike
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "permitTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes)"
  ): TypedContractMethod<
    [
      permit: ISignatureTransfer.PermitBatchTransferFromStruct,
      transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct[],
      owner: AddressLike,
      signature: BytesLike
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "permitWitnessTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes32,string,bytes)"
  ): TypedContractMethod<
    [
      permit: ISignatureTransfer.PermitTransferFromStruct,
      transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct,
      owner: AddressLike,
      witness: BytesLike,
      witnessTypeString: string,
      signature: BytesLike
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "permitWitnessTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes32,string,bytes)"
  ): TypedContractMethod<
    [
      permit: ISignatureTransfer.PermitBatchTransferFromStruct,
      transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct[],
      owner: AddressLike,
      witness: BytesLike,
      witnessTypeString: string,
      signature: BytesLike
    ],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "transferFrom((address,address,uint160,address)[])"
  ): TypedContractMethod<
    [transferDetails: IAllowanceTransfer.AllowanceTransferDetailsStruct[]],
    [void],
    "nonpayable"
  >;
  getFunction(
    nameOrSignature: "transferFrom(address,address,uint160,address)"
  ): TypedContractMethod<
    [
      from: AddressLike,
      to: AddressLike,
      amount: BigNumberish,
      token: AddressLike
    ],
    [void],
    "nonpayable"
  >;

  getEvent(
    key: "Approval"
  ): TypedContractEvent<
    ApprovalEvent.InputTuple,
    ApprovalEvent.OutputTuple,
    ApprovalEvent.OutputObject
  >;
  getEvent(
    key: "Lockdown"
  ): TypedContractEvent<
    LockdownEvent.InputTuple,
    LockdownEvent.OutputTuple,
    LockdownEvent.OutputObject
  >;
  getEvent(
    key: "NonceInvalidation"
  ): TypedContractEvent<
    NonceInvalidationEvent.InputTuple,
    NonceInvalidationEvent.OutputTuple,
    NonceInvalidationEvent.OutputObject
  >;
  getEvent(
    key: "Permit"
  ): TypedContractEvent<
    PermitEvent.InputTuple,
    PermitEvent.OutputTuple,
    PermitEvent.OutputObject
  >;
  getEvent(
    key: "UnorderedNonceInvalidation"
  ): TypedContractEvent<
    UnorderedNonceInvalidationEvent.InputTuple,
    UnorderedNonceInvalidationEvent.OutputTuple,
    UnorderedNonceInvalidationEvent.OutputObject
  >;

  filters: {
    "Approval(address,address,address,uint160,uint48)": TypedContractEvent<
      ApprovalEvent.InputTuple,
      ApprovalEvent.OutputTuple,
      ApprovalEvent.OutputObject
    >;
    Approval: TypedContractEvent<
      ApprovalEvent.InputTuple,
      ApprovalEvent.OutputTuple,
      ApprovalEvent.OutputObject
    >;

    "Lockdown(address,address,address)": TypedContractEvent<
      LockdownEvent.InputTuple,
      LockdownEvent.OutputTuple,
      LockdownEvent.OutputObject
    >;
    Lockdown: TypedContractEvent<
      LockdownEvent.InputTuple,
      LockdownEvent.OutputTuple,
      LockdownEvent.OutputObject
    >;

    "NonceInvalidation(address,address,address,uint48,uint48)": TypedContractEvent<
      NonceInvalidationEvent.InputTuple,
      NonceInvalidationEvent.OutputTuple,
      NonceInvalidationEvent.OutputObject
    >;
    NonceInvalidation: TypedContractEvent<
      NonceInvalidationEvent.InputTuple,
      NonceInvalidationEvent.OutputTuple,
      NonceInvalidationEvent.OutputObject
    >;

    "Permit(address,address,address,uint160,uint48,uint48)": TypedContractEvent<
      PermitEvent.InputTuple,
      PermitEvent.OutputTuple,
      PermitEvent.OutputObject
    >;
    Permit: TypedContractEvent<
      PermitEvent.InputTuple,
      PermitEvent.OutputTuple,
      PermitEvent.OutputObject
    >;

    "UnorderedNonceInvalidation(address,uint256,uint256)": TypedContractEvent<
      UnorderedNonceInvalidationEvent.InputTuple,
      UnorderedNonceInvalidationEvent.OutputTuple,
      UnorderedNonceInvalidationEvent.OutputObject
    >;
    UnorderedNonceInvalidation: TypedContractEvent<
      UnorderedNonceInvalidationEvent.InputTuple,
      UnorderedNonceInvalidationEvent.OutputTuple,
      UnorderedNonceInvalidationEvent.OutputObject
    >;
  };
}
