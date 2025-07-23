import { AbstractProvider, AddressLike, Authorization, AuthorizationRequest, BaseContract, BigNumberish, BlockTag, BytesLike, ContractMethod, ContractRunner, ContractTransaction, ContractTransactionResponse, DeferredTopicFilter, EnsResolver as ethEnsResolver, EventFragment, EventLog, FeeData, FetchRequest, FunctionFragment, Interface, JsonRpcApiProviderOptions, JsonRpcProvider, Listener, LogDescription, Network, Networkish, PerformActionRequest, Provider, Provider as ethProvider, Result, Signer, SigningKey, TransactionLike, TransactionReceipt, TransactionRequest, TransactionResponse, Typed, TypedDataDomain, TypedDataField } from 'ethers';
import { Dispatcher, RequestInit as RequestInit$1 } from 'undici-types';

declare class EnsResolver extends ethEnsResolver {
	#private;
	/**
	 * Overrides method to support both ENS & Basename
	 */
	supportsWildcard(): Promise<boolean>;
	static getEnsAddress(provider: Provider): Promise<string>;
	static fromName(provider: AbstractProvider, name: string): Promise<null | EnsResolver>;
	static lookupAddress(provider: AbstractProvider, address: string, reverseCheck?: boolean): Promise<null | string>;
	/**
	 * Method overrides to handle errors if name doesn't exist
	 * (Error: could not decode result data ethers/src.ts/providers/ens-resolver.ts:249:30)
	 * (Cannot be handled by checking if resolver address is null or result is '0x')
	 * (Likely bug on #fetch from EnsResolver with return iface.decodeFunctionResult(fragment, result)[0];)
	 */
	getAddress(coinType?: number): Promise<null | string>;
	getText(key: string): Promise<null | string>;
	getContentHash(): Promise<null | string>;
	getAvatar(): Promise<null | string>;
}
export interface TypedDeferredTopicFilter<_TCEvent extends TypedContractEvent> extends DeferredTopicFilter {
}
export interface TypedContractEvent<InputTuple extends Array<any> = any, OutputTuple extends Array<any> = any, OutputObject = any> {
	(...args: Partial<InputTuple>): TypedDeferredTopicFilter<TypedContractEvent<InputTuple, OutputTuple, OutputObject>>;
	name: string;
	fragment: EventFragment;
	getFragment(...args: Partial<InputTuple>): EventFragment;
}
export type __TypechainAOutputTuple<T> = T extends TypedContractEvent<infer _U, infer W> ? W : never;
export type __TypechainOutputObject<T> = T extends TypedContractEvent<infer _U, infer _W, infer V> ? V : never;
export interface TypedEventLog<TCEvent extends TypedContractEvent> extends Omit<EventLog, "args"> {
	args: __TypechainAOutputTuple<TCEvent> & __TypechainOutputObject<TCEvent>;
}
export interface TypedLogDescription<TCEvent extends TypedContractEvent> extends Omit<LogDescription, "args"> {
	args: __TypechainAOutputTuple<TCEvent> & __TypechainOutputObject<TCEvent>;
}
export type TypedListener<TCEvent extends TypedContractEvent> = (...listenerArg: [
	...__TypechainAOutputTuple<TCEvent>,
	TypedEventLog<TCEvent>,
	...undefined[]
]) => void;
export type StateMutability = "nonpayable" | "payable" | "view";
export type BaseOverrides = Omit<TransactionRequest, "to" | "data">;
export type NonPayableOverrides = Omit<BaseOverrides, "value" | "blockTag" | "enableCcipRead">;
export type PayableOverrides = Omit<BaseOverrides, "blockTag" | "enableCcipRead">;
export type ViewOverrides = Omit<TransactionRequest, "to" | "data">;
export type Overrides<S extends StateMutability> = S extends "nonpayable" ? NonPayableOverrides : S extends "payable" ? PayableOverrides : ViewOverrides;
export type PostfixOverrides<A extends Array<any>, S extends StateMutability> = A | [
	...A,
	Overrides<S>
];
export type ContractMethodArgs<A extends Array<any>, S extends StateMutability> = PostfixOverrides<{
	[I in keyof A]-?: A[I] | Typed;
}, S>;
export type DefaultReturnType<R> = R extends Array<any> ? R[0] : R;
export interface TypedContractMethod<A extends Array<any> = Array<any>, R = any, S extends StateMutability = "payable"> {
	(...args: ContractMethodArgs<A, S>): S extends "view" ? Promise<DefaultReturnType<R>> : Promise<ContractTransactionResponse>;
	name: string;
	fragment: FunctionFragment;
	getFragment(...args: ContractMethodArgs<A, S>): FunctionFragment;
	populateTransaction(...args: ContractMethodArgs<A, S>): Promise<ContractTransaction>;
	staticCall(...args: ContractMethodArgs<A, "view">): Promise<DefaultReturnType<R>>;
	send(...args: ContractMethodArgs<A, S>): Promise<ContractTransactionResponse>;
	estimateGas(...args: ContractMethodArgs<A, S>): Promise<bigint>;
	staticCallResult(...args: ContractMethodArgs<A, "view">): Promise<R>;
}
export interface ERC20Interface extends Interface {
	getFunction(nameOrSignature: "DOMAIN_SEPARATOR" | "allowance" | "approve" | "balanceOf" | "decimals" | "name" | "nonces" | "permit" | "symbol" | "totalSupply" | "transfer" | "transferFrom"): FunctionFragment;
	getEvent(nameOrSignatureOrTopic: "Approval" | "Transfer"): EventFragment;
	encodeFunctionData(functionFragment: "DOMAIN_SEPARATOR", values?: undefined): string;
	encodeFunctionData(functionFragment: "allowance", values: [
		AddressLike,
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "approve", values: [
		AddressLike,
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "balanceOf", values: [
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "decimals", values?: undefined): string;
	encodeFunctionData(functionFragment: "name", values?: undefined): string;
	encodeFunctionData(functionFragment: "nonces", values: [
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "permit", values: [
		AddressLike,
		AddressLike,
		BigNumberish,
		BigNumberish,
		BigNumberish,
		BytesLike,
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "symbol", values?: undefined): string;
	encodeFunctionData(functionFragment: "totalSupply", values?: undefined): string;
	encodeFunctionData(functionFragment: "transfer", values: [
		AddressLike,
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "transferFrom", values: [
		AddressLike,
		AddressLike,
		BigNumberish
	]): string;
	decodeFunctionResult(functionFragment: "DOMAIN_SEPARATOR", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "allowance", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "approve", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "decimals", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "nonces", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "permit", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "symbol", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "totalSupply", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "transfer", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "transferFrom", data: BytesLike): Result;
}
declare namespace ApprovalEvent {
	type InputTuple = [
		owner: AddressLike,
		spender: AddressLike,
		value: BigNumberish
	];
	type OutputTuple = [
		owner: string,
		spender: string,
		value: bigint
	];
	interface OutputObject {
		owner: string;
		spender: string;
		value: bigint;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
declare namespace TransferEvent {
	type InputTuple = [
		from: AddressLike,
		to: AddressLike,
		value: BigNumberish
	];
	type OutputTuple = [
		from: string,
		to: string,
		value: bigint
	];
	interface OutputObject {
		from: string;
		to: string;
		value: bigint;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
export interface ERC20 extends BaseContract {
	connect(runner?: ContractRunner | null): ERC20;
	waitForDeployment(): Promise<this>;
	interface: ERC20Interface;
	queryFilter<TCEvent extends TypedContractEvent>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
	queryFilter<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
	on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
	on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
	once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
	once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
	listeners<TCEvent extends TypedContractEvent>(event: TCEvent): Promise<Array<TypedListener<TCEvent>>>;
	listeners(eventName?: string): Promise<Array<Listener>>;
	removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
	DOMAIN_SEPARATOR: TypedContractMethod<[
	], [
		string
	], "view">;
	allowance: TypedContractMethod<[
		owner: AddressLike,
		spender: AddressLike
	], [
		bigint
	], "view">;
	approve: TypedContractMethod<[
		spender: AddressLike,
		value: BigNumberish
	], [
		boolean
	], "nonpayable">;
	balanceOf: TypedContractMethod<[
		account: AddressLike
	], [
		bigint
	], "view">;
	decimals: TypedContractMethod<[
	], [
		bigint
	], "view">;
	name: TypedContractMethod<[
	], [
		string
	], "view">;
	nonces: TypedContractMethod<[
		owner: AddressLike
	], [
		bigint
	], "view">;
	permit: TypedContractMethod<[
		owner: AddressLike,
		spender: AddressLike,
		value: BigNumberish,
		deadline: BigNumberish,
		v: BigNumberish,
		r: BytesLike,
		s: BytesLike
	], [
		void
	], "nonpayable">;
	symbol: TypedContractMethod<[
	], [
		string
	], "view">;
	totalSupply: TypedContractMethod<[
	], [
		bigint
	], "view">;
	transfer: TypedContractMethod<[
		to: AddressLike,
		value: BigNumberish
	], [
		boolean
	], "nonpayable">;
	transferFrom: TypedContractMethod<[
		from: AddressLike,
		to: AddressLike,
		value: BigNumberish
	], [
		boolean
	], "nonpayable">;
	getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
	getFunction(nameOrSignature: "DOMAIN_SEPARATOR"): TypedContractMethod<[
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "allowance"): TypedContractMethod<[
		owner: AddressLike,
		spender: AddressLike
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "approve"): TypedContractMethod<[
		spender: AddressLike,
		value: BigNumberish
	], [
		boolean
	], "nonpayable">;
	getFunction(nameOrSignature: "balanceOf"): TypedContractMethod<[
		account: AddressLike
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "decimals"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "name"): TypedContractMethod<[
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "nonces"): TypedContractMethod<[
		owner: AddressLike
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "permit"): TypedContractMethod<[
		owner: AddressLike,
		spender: AddressLike,
		value: BigNumberish,
		deadline: BigNumberish,
		v: BigNumberish,
		r: BytesLike,
		s: BytesLike
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "symbol"): TypedContractMethod<[
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "totalSupply"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "transfer"): TypedContractMethod<[
		to: AddressLike,
		value: BigNumberish
	], [
		boolean
	], "nonpayable">;
	getFunction(nameOrSignature: "transferFrom"): TypedContractMethod<[
		from: AddressLike,
		to: AddressLike,
		value: BigNumberish
	], [
		boolean
	], "nonpayable">;
	getEvent(key: "Approval"): TypedContractEvent<ApprovalEvent.InputTuple, ApprovalEvent.OutputTuple, ApprovalEvent.OutputObject>;
	getEvent(key: "Transfer"): TypedContractEvent<TransferEvent.InputTuple, TransferEvent.OutputTuple, TransferEvent.OutputObject>;
	filters: {
		"Approval(address,address,uint256)": TypedContractEvent<ApprovalEvent.InputTuple, ApprovalEvent.OutputTuple, ApprovalEvent.OutputObject>;
		Approval: TypedContractEvent<ApprovalEvent.InputTuple, ApprovalEvent.OutputTuple, ApprovalEvent.OutputObject>;
		"Transfer(address,address,uint256)": TypedContractEvent<TransferEvent.InputTuple, TransferEvent.OutputTuple, TransferEvent.OutputObject>;
		Transfer: TypedContractEvent<TransferEvent.InputTuple, TransferEvent.OutputTuple, TransferEvent.OutputObject>;
	};
}
declare namespace Multicall3 {
	type CallStruct = {
		target: AddressLike;
		callData: BytesLike;
	};
	type CallStructOutput = [
		target: string,
		callData: string
	] & {
		target: string;
		callData: string;
	};
	type Call3Struct = {
		target: AddressLike;
		allowFailure: boolean;
		callData: BytesLike;
	};
	type Call3StructOutput = [
		target: string,
		allowFailure: boolean,
		callData: string
	] & {
		target: string;
		allowFailure: boolean;
		callData: string;
	};
	type ResultStruct = {
		success: boolean;
		returnData: BytesLike;
	};
	type ResultStructOutput = [
		success: boolean,
		returnData: string
	] & {
		success: boolean;
		returnData: string;
	};
	type Call3ValueStruct = {
		target: AddressLike;
		allowFailure: boolean;
		value: BigNumberish;
		callData: BytesLike;
	};
	type Call3ValueStructOutput = [
		target: string,
		allowFailure: boolean,
		value: bigint,
		callData: string
	] & {
		target: string;
		allowFailure: boolean;
		value: bigint;
		callData: string;
	};
}
export interface MulticallInterface extends Interface {
	getFunction(nameOrSignature: "aggregate" | "aggregate3" | "aggregate3Value" | "blockAndAggregate" | "getBasefee" | "getBlockHash" | "getBlockNumber" | "getChainId" | "getCurrentBlockCoinbase" | "getCurrentBlockDifficulty" | "getCurrentBlockGasLimit" | "getCurrentBlockTimestamp" | "getEthBalance" | "getLastBlockHash" | "tryAggregate" | "tryBlockAndAggregate"): FunctionFragment;
	encodeFunctionData(functionFragment: "aggregate", values: [
		Multicall3.CallStruct[]
	]): string;
	encodeFunctionData(functionFragment: "aggregate3", values: [
		Multicall3.Call3Struct[]
	]): string;
	encodeFunctionData(functionFragment: "aggregate3Value", values: [
		Multicall3.Call3ValueStruct[]
	]): string;
	encodeFunctionData(functionFragment: "blockAndAggregate", values: [
		Multicall3.CallStruct[]
	]): string;
	encodeFunctionData(functionFragment: "getBasefee", values?: undefined): string;
	encodeFunctionData(functionFragment: "getBlockHash", values: [
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "getBlockNumber", values?: undefined): string;
	encodeFunctionData(functionFragment: "getChainId", values?: undefined): string;
	encodeFunctionData(functionFragment: "getCurrentBlockCoinbase", values?: undefined): string;
	encodeFunctionData(functionFragment: "getCurrentBlockDifficulty", values?: undefined): string;
	encodeFunctionData(functionFragment: "getCurrentBlockGasLimit", values?: undefined): string;
	encodeFunctionData(functionFragment: "getCurrentBlockTimestamp", values?: undefined): string;
	encodeFunctionData(functionFragment: "getEthBalance", values: [
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "getLastBlockHash", values?: undefined): string;
	encodeFunctionData(functionFragment: "tryAggregate", values: [
		boolean,
		Multicall3.CallStruct[]
	]): string;
	encodeFunctionData(functionFragment: "tryBlockAndAggregate", values: [
		boolean,
		Multicall3.CallStruct[]
	]): string;
	decodeFunctionResult(functionFragment: "aggregate", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "aggregate3", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "aggregate3Value", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "blockAndAggregate", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getBasefee", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getBlockHash", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getBlockNumber", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getChainId", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getCurrentBlockCoinbase", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getCurrentBlockDifficulty", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getCurrentBlockGasLimit", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getCurrentBlockTimestamp", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getEthBalance", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getLastBlockHash", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "tryAggregate", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "tryBlockAndAggregate", data: BytesLike): Result;
}
export interface Multicall extends BaseContract {
	connect(runner?: ContractRunner | null): Multicall;
	waitForDeployment(): Promise<this>;
	interface: MulticallInterface;
	queryFilter<TCEvent extends TypedContractEvent>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
	queryFilter<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
	on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
	on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
	once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
	once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
	listeners<TCEvent extends TypedContractEvent>(event: TCEvent): Promise<Array<TypedListener<TCEvent>>>;
	listeners(eventName?: string): Promise<Array<Listener>>;
	removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
	aggregate: TypedContractMethod<[
		calls: Multicall3.CallStruct[]
	], [
		[
			bigint,
			string[]
		] & {
			blockNumber: bigint;
			returnData: string[];
		}
	], "payable">;
	aggregate3: TypedContractMethod<[
		calls: Multicall3.Call3Struct[]
	], [
		Multicall3.ResultStructOutput[]
	], "payable">;
	aggregate3Value: TypedContractMethod<[
		calls: Multicall3.Call3ValueStruct[]
	], [
		Multicall3.ResultStructOutput[]
	], "payable">;
	blockAndAggregate: TypedContractMethod<[
		calls: Multicall3.CallStruct[]
	], [
		[
			bigint,
			string,
			Multicall3.ResultStructOutput[]
		] & {
			blockNumber: bigint;
			blockHash: string;
			returnData: Multicall3.ResultStructOutput[];
		}
	], "payable">;
	getBasefee: TypedContractMethod<[
	], [
		bigint
	], "view">;
	getBlockHash: TypedContractMethod<[
		blockNumber: BigNumberish
	], [
		string
	], "view">;
	getBlockNumber: TypedContractMethod<[
	], [
		bigint
	], "view">;
	getChainId: TypedContractMethod<[
	], [
		bigint
	], "view">;
	getCurrentBlockCoinbase: TypedContractMethod<[
	], [
		string
	], "view">;
	getCurrentBlockDifficulty: TypedContractMethod<[
	], [
		bigint
	], "view">;
	getCurrentBlockGasLimit: TypedContractMethod<[
	], [
		bigint
	], "view">;
	getCurrentBlockTimestamp: TypedContractMethod<[
	], [
		bigint
	], "view">;
	getEthBalance: TypedContractMethod<[
		addr: AddressLike
	], [
		bigint
	], "view">;
	getLastBlockHash: TypedContractMethod<[
	], [
		string
	], "view">;
	tryAggregate: TypedContractMethod<[
		requireSuccess: boolean,
		calls: Multicall3.CallStruct[]
	], [
		Multicall3.ResultStructOutput[]
	], "payable">;
	tryBlockAndAggregate: TypedContractMethod<[
		requireSuccess: boolean,
		calls: Multicall3.CallStruct[]
	], [
		[
			bigint,
			string,
			Multicall3.ResultStructOutput[]
		] & {
			blockNumber: bigint;
			blockHash: string;
			returnData: Multicall3.ResultStructOutput[];
		}
	], "payable">;
	getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
	getFunction(nameOrSignature: "aggregate"): TypedContractMethod<[
		calls: Multicall3.CallStruct[]
	], [
		[
			bigint,
			string[]
		] & {
			blockNumber: bigint;
			returnData: string[];
		}
	], "payable">;
	getFunction(nameOrSignature: "aggregate3"): TypedContractMethod<[
		calls: Multicall3.Call3Struct[]
	], [
		Multicall3.ResultStructOutput[]
	], "payable">;
	getFunction(nameOrSignature: "aggregate3Value"): TypedContractMethod<[
		calls: Multicall3.Call3ValueStruct[]
	], [
		Multicall3.ResultStructOutput[]
	], "payable">;
	getFunction(nameOrSignature: "blockAndAggregate"): TypedContractMethod<[
		calls: Multicall3.CallStruct[]
	], [
		[
			bigint,
			string,
			Multicall3.ResultStructOutput[]
		] & {
			blockNumber: bigint;
			blockHash: string;
			returnData: Multicall3.ResultStructOutput[];
		}
	], "payable">;
	getFunction(nameOrSignature: "getBasefee"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getBlockHash"): TypedContractMethod<[
		blockNumber: BigNumberish
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "getBlockNumber"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getChainId"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getCurrentBlockCoinbase"): TypedContractMethod<[
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "getCurrentBlockDifficulty"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getCurrentBlockGasLimit"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getCurrentBlockTimestamp"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getEthBalance"): TypedContractMethod<[
		addr: AddressLike
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getLastBlockHash"): TypedContractMethod<[
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "tryAggregate"): TypedContractMethod<[
		requireSuccess: boolean,
		calls: Multicall3.CallStruct[]
	], [
		Multicall3.ResultStructOutput[]
	], "payable">;
	getFunction(nameOrSignature: "tryBlockAndAggregate"): TypedContractMethod<[
		requireSuccess: boolean,
		calls: Multicall3.CallStruct[]
	], [
		[
			bigint,
			string,
			Multicall3.ResultStructOutput[]
		] & {
			blockNumber: bigint;
			blockHash: string;
			returnData: Multicall3.ResultStructOutput[];
		}
	], "payable">;
	filters: {};
}
export interface OpGasPriceOracleInterface extends Interface {
	getFunction(nameOrSignature: "DECIMALS" | "baseFee" | "baseFeeScalar" | "blobBaseFee" | "blobBaseFeeScalar" | "decimals" | "gasPrice" | "getL1Fee" | "getL1FeeUpperBound" | "getL1GasUsed" | "isEcotone" | "isFjord" | "l1BaseFee" | "overhead" | "scalar" | "setEcotone" | "setFjord" | "version"): FunctionFragment;
	encodeFunctionData(functionFragment: "DECIMALS", values?: undefined): string;
	encodeFunctionData(functionFragment: "baseFee", values?: undefined): string;
	encodeFunctionData(functionFragment: "baseFeeScalar", values?: undefined): string;
	encodeFunctionData(functionFragment: "blobBaseFee", values?: undefined): string;
	encodeFunctionData(functionFragment: "blobBaseFeeScalar", values?: undefined): string;
	encodeFunctionData(functionFragment: "decimals", values?: undefined): string;
	encodeFunctionData(functionFragment: "gasPrice", values?: undefined): string;
	encodeFunctionData(functionFragment: "getL1Fee", values: [
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "getL1FeeUpperBound", values: [
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "getL1GasUsed", values: [
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "isEcotone", values?: undefined): string;
	encodeFunctionData(functionFragment: "isFjord", values?: undefined): string;
	encodeFunctionData(functionFragment: "l1BaseFee", values?: undefined): string;
	encodeFunctionData(functionFragment: "overhead", values?: undefined): string;
	encodeFunctionData(functionFragment: "scalar", values?: undefined): string;
	encodeFunctionData(functionFragment: "setEcotone", values?: undefined): string;
	encodeFunctionData(functionFragment: "setFjord", values?: undefined): string;
	encodeFunctionData(functionFragment: "version", values?: undefined): string;
	decodeFunctionResult(functionFragment: "DECIMALS", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "baseFee", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "baseFeeScalar", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "blobBaseFee", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "blobBaseFeeScalar", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "decimals", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "gasPrice", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getL1Fee", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getL1FeeUpperBound", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getL1GasUsed", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "isEcotone", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "isFjord", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "l1BaseFee", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "overhead", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "scalar", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "setEcotone", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "setFjord", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "version", data: BytesLike): Result;
}
export interface OpGasPriceOracle extends BaseContract {
	connect(runner?: ContractRunner | null): OpGasPriceOracle;
	waitForDeployment(): Promise<this>;
	interface: OpGasPriceOracleInterface;
	queryFilter<TCEvent extends TypedContractEvent>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
	queryFilter<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
	on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
	on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
	once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
	once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
	listeners<TCEvent extends TypedContractEvent>(event: TCEvent): Promise<Array<TypedListener<TCEvent>>>;
	listeners(eventName?: string): Promise<Array<Listener>>;
	removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
	DECIMALS: TypedContractMethod<[
	], [
		bigint
	], "view">;
	baseFee: TypedContractMethod<[
	], [
		bigint
	], "view">;
	baseFeeScalar: TypedContractMethod<[
	], [
		bigint
	], "view">;
	blobBaseFee: TypedContractMethod<[
	], [
		bigint
	], "view">;
	blobBaseFeeScalar: TypedContractMethod<[
	], [
		bigint
	], "view">;
	decimals: TypedContractMethod<[
	], [
		bigint
	], "view">;
	gasPrice: TypedContractMethod<[
	], [
		bigint
	], "view">;
	getL1Fee: TypedContractMethod<[
		_data: BytesLike
	], [
		bigint
	], "view">;
	getL1FeeUpperBound: TypedContractMethod<[
		_unsignedTxSize: BigNumberish
	], [
		bigint
	], "view">;
	getL1GasUsed: TypedContractMethod<[
		_data: BytesLike
	], [
		bigint
	], "view">;
	isEcotone: TypedContractMethod<[
	], [
		boolean
	], "view">;
	isFjord: TypedContractMethod<[
	], [
		boolean
	], "view">;
	l1BaseFee: TypedContractMethod<[
	], [
		bigint
	], "view">;
	overhead: TypedContractMethod<[
	], [
		bigint
	], "view">;
	scalar: TypedContractMethod<[
	], [
		bigint
	], "view">;
	setEcotone: TypedContractMethod<[
	], [
		void
	], "nonpayable">;
	setFjord: TypedContractMethod<[
	], [
		void
	], "nonpayable">;
	version: TypedContractMethod<[
	], [
		string
	], "view">;
	getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
	getFunction(nameOrSignature: "DECIMALS"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "baseFee"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "baseFeeScalar"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "blobBaseFee"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "blobBaseFeeScalar"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "decimals"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "gasPrice"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getL1Fee"): TypedContractMethod<[
		_data: BytesLike
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getL1FeeUpperBound"): TypedContractMethod<[
		_unsignedTxSize: BigNumberish
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getL1GasUsed"): TypedContractMethod<[
		_data: BytesLike
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "isEcotone"): TypedContractMethod<[
	], [
		boolean
	], "view">;
	getFunction(nameOrSignature: "isFjord"): TypedContractMethod<[
	], [
		boolean
	], "view">;
	getFunction(nameOrSignature: "l1BaseFee"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "overhead"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "scalar"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "setEcotone"): TypedContractMethod<[
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "setFjord"): TypedContractMethod<[
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "version"): TypedContractMethod<[
	], [
		string
	], "view">;
	filters: {};
}
/**
 * Details for a call trace (internal transaction) within a transaction or block.
 */
export interface CallTrace {
	from: string;
	gas: number;
	gasUsed: number;
	to: string;
	input: string;
	output?: string;
	calls?: any;
	value: bigint;
	type: string;
	blockNumber: number;
	blockHash?: string;
	txHash: string;
}
export interface fetchOptions extends Omit<RequestInit$1, "headers"> {
	headers?: any;
	timeout?: number;
	dispatcher?: Dispatcher;
}
/**
 * Result for a single Multicall call.
 */
export interface MulticallResult {
	status: boolean;
	data: string;
}
/**
 * State object for a batched Multicall request.
 */
export interface MulticallHandle {
	request: {
		to: string;
		data: string;
	};
	resolve: (result: MulticallResult) => void;
	reject: (error: any) => void;
	resolved: boolean;
}
declare class FeeDataExt extends FeeData {
	readonly maxPriorityFeePerGasSlow: null | bigint;
	readonly maxPriorityFeePerGasMedium: null | bigint;
	/**
	 * @param gasPrice The gas price or null.
	 * @param maxFeePerGas The EIP-1559 max fee per gas.
	 * @param maxPriorityFeePerGas The max priority fee per gas.
	 * @param maxPriorityFeePerGasSlow Optional: Lower percentile priority fee.
	 * @param maxPriorityFeePerGasMedium Optional: Medium percentile priority fee.
	 */
	constructor(gasPrice?: null | bigint, maxFeePerGas?: null | bigint, maxPriorityFeePerGas?: null | bigint, maxPriorityFeePerGasSlow?: null | bigint, maxPriorityFeePerGasMedium?: null | bigint);
	/**
	 *  Returns a JSON-friendly value.
	 */
	toJSON(): any;
}
/**
 * Provider configuration options, including multicall, fees, ENS handling, and more.
 */
export interface ProviderOptions extends JsonRpcApiProviderOptions {
	hardhatProvider?: ethProvider;
	fetchOptions?: fetchOptions;
	chainId?: bigint | number;
	ensResolver?: typeof EnsResolver;
	feeHistory?: boolean;
	multicall?: string;
	multicallAllowFailure?: boolean;
	multicallMaxCount?: number;
	multicallStallTime?: number;
}
declare class Provider$1 extends JsonRpcProvider {
	#private;
	hardhatProvider?: ethProvider;
	staticNetwork: Promise<Network>;
	ensResolver: Promise<typeof EnsResolver>;
	feeHistory: boolean;
	/**
	 * Multicall obj
	 */
	multicall: Multicall;
	multicallAllowFailure: boolean;
	multicallMaxCount: number;
	multicallStallTime: number;
	multicallQueue: MulticallHandle[];
	multicallTimer: null | ReturnType<typeof setTimeout>;
	/**
	 * Create a new Provider.
	 * @param url RPC URL or FetchRequest.
	 * @param network Networkish.
	 * @param options Provider options.
	 */
	constructor(url?: string | FetchRequest, network?: Networkish, options?: ProviderOptions);
	/** Gets the detected or static network. */
	get _network(): Network;
	/** @override Resolves to the network, or throws and ensures auto-destroy on error. */
	_detectNetwork(): Promise<Network>;
	/**
	 * Override getFeeData func from AbstractProvider to get results as-is.
	 *
	 * Return fee as is from provider, it is up to populateTransaction func to compose them
	 *
	 * Note that in some networks (like L2), maxFeePerGas can be smaller than maxPriorityFeePerGas and if so,
	 * using the value as is could throw an error from RPC as maxFeePerGas should be always bigger than maxPriorityFeePerGas
	 *
	 * @returns Promise resolving to FeeDataExt instance.
	 */
	getFeeData(): Promise<FeeDataExt>;
	/**
	 * Returns the ENS resolver for the specified name.
	 * @param name ENS name to resolve.
	 * @returns Resolves to an EnsResolver or null.
	 */
	getResolver(name: string): Promise<null | EnsResolver>;
	/**
	 * Performs a reverse-lookup (address to ENS, if any).
	 * @param address Address to lookup.
	 * @param reverseCheck Perform confirmation roundtrip.
	 * @returns ENS name or null.
	 */
	lookupAddress(address: string, reverseCheck?: boolean): Promise<null | string>;
	/**
	 * Waits for specified transaction (or hash) to confirm, with default timeout.
	 * Does not throw on timeout.
	 * @param hashOrTx TransactionResponse or hash or null.
	 * @returns Null or the TransactionReceipt if confirmed.
	 */
	wait(hashOrTx: null | string | TransactionResponse): Promise<null | TransactionReceipt>;
	/**
	 * Returns whether an address has code (i.e., is a contract) on-chain.
	 * @param address Address to check.
	 * @returns True if code exists (contract), false otherwise.
	 */
	hasCode(address: string): Promise<boolean>;
	/**
	 * Gets receipts for all transactions in a block as an array.
	 * @param blockTag Block to query.
	 * @returns Promise resolving to an array of TransactionReceipts.
	 */
	getBlockReceipts(blockTag?: BlockTag): Promise<TransactionReceipt[]>;
	/**
	 * Trace internal calls for a whole block.
	 * @param blockTag Block to trace.
	 * @param onlyTopCall If true, only trace top-level calls.
	 * @returns Array of CallTrace objects for each transaction in the block.
	 */
	traceBlock(blockTag?: BlockTag, onlyTopCall?: boolean): Promise<CallTrace[]>;
	/**
	 * Trace internal calls for a given transaction hash.
	 * @param hash Transaction hash.
	 * @param onlyTopCall If true, only trace the top-level call.
	 * @returns CallTrace object for the traced transaction.
	 */
	traceTransaction(hash: string, onlyTopCall?: boolean): Promise<CallTrace>;
	/**
	 * Multicaller
	 */
	_drainCalls(): Promise<void>;
	/**
	 * Queue a Multicall aggregate3 call (internal).
	 * @private
	 * @param to Call target address.
	 * @param data Calldata.
	 */
	_queueCall(to: string, data?: string): Promise<MulticallResult>;
	_perform<T = any>(req: PerformActionRequest): Promise<T>;
	/**
	 * For Hardhat test environments, reroutes .send() calls to the in-memory provider.
	 * @override
	 */
	send(method: string, params: any[] | Record<string, any>): Promise<any>;
}
/**
 * Transaction response with possible additional fee info.
 */
export interface TransactionResponseWithFees extends TransactionResponse {
	l1Fee?: bigint;
	txCost?: bigint;
}
/**
 * Multiplier function to adjust gas price or gas limit for bumping.
 */
export type feeMultiplier = () => Promise<number> | number;
/** Custom function for priority fee per gas. */
export type customPriorityFee = () => Promise<bigint> | bigint;
/**
 * ProxySigner option bag.
 */
export interface ProxySignerOptions {
	appProvider?: Provider;
	opGasPriceOracle?: string;
	wrapProvider?: boolean;
	wrapProviderOptions?: ProviderOptions;
	autoValue?: boolean;
	gasPriceBump?: feeMultiplier;
	gasLimitBump?: feeMultiplier;
	customPriorityFee?: customPriorityFee;
	gasLimitFailover?: boolean;
}
/**
 * A signer extended with address plus options.
 */
export interface SignerWithAddress extends Signer, Omit<ProxySignerOptions, "wrapProvider" | "opGasPriceOracle"> {
	address: string;
	opGasPriceOracle?: OpGasPriceOracle;
	isHardhat?: boolean;
}
declare class ProxySigner implements SignerWithAddress {
	#private;
	parentSigner: SignerWithAddress;
	isHardhat?: boolean;
	appProvider?: Provider;
	opGasPriceOracle?: OpGasPriceOracle;
	autoValue: boolean;
	gasPriceBump?: feeMultiplier;
	gasLimitBump?: feeMultiplier;
	customPriorityFee?: customPriorityFee;
	gasLimitFailover: boolean;
	/**
	 * Instantiates a ProxySigner from a parent Signer.
	 * @param parentSigner The underlying Signer.
	 * @param options Additional options.
	 */
	constructor(parentSigner: SignerWithAddress, options?: ProxySignerOptions);
	/**
	 * Returns the address this signer represents.
	 * @returns Address string.
	 */
	get address(): string;
	/**
	 * Provider attached to this signer (possibly a wrapped WProvider).
	 * @returns Provider instance.
	 */
	get provider(): Provider$1 | Provider;
	/**
	 * Creates an array of ProxySigners from an array of Signers. (like for hre.ethers.getSigners())
	 * @param signers Array of SignerWithAddress.
	 * @param options Optional proxy options to apply to all.
	 */
	static fromSigners(signers: SignerWithAddress[], options?: ProxySignerOptions): ProxySigner[];
	/**
	 * Returns a ProxySigner for a given address, attached to the given provider.
	 * (e.g., for a read-only address).
	 */
	static fromAddress(address: string, provider?: Provider, options?: ProxySignerOptions): ProxySigner;
	/** Returns ProxySigner using a private key. */
	static fromPrivateKey(privateKey: string | SigningKey, provider?: Provider, options?: ProxySignerOptions): ProxySigner;
	/** Returns ProxySigner using a BIP-39 mnemonic phrase. */
	static fromMnemonic(mnemonic: string, provider?: Provider, index?: number, options?: ProxySignerOptions): ProxySigner;
	populateTransaction(tx: TransactionRequest): Promise<TransactionLike<string>>;
	sendTransaction(tx: TransactionRequest): Promise<TransactionResponseWithFees>;
	/**
	 * For convenience with JsonRpcSigner type
	 */
	sendUncheckedTransaction(tx: TransactionRequest): Promise<string>;
	unlock(password: string): Promise<boolean>;
	_legacySignMessage(_message: string | Uint8Array): Promise<string>;
	/**
	 * For the rest of methods proxy it
	 */
	getAddress(): Promise<string>;
	connect(provider: null | Provider): Signer;
	getNonce(blockTag?: BlockTag): Promise<number>;
	populateCall(tx: TransactionRequest): Promise<TransactionLike<string>>;
	estimateGas(tx: TransactionRequest): Promise<bigint>;
	call(tx: TransactionRequest): Promise<string>;
	resolveName(name: string): Promise<null | string>;
	signTransaction(tx: TransactionRequest): Promise<string>;
	signMessage(message: string | Uint8Array): Promise<string>;
	signTypedData(domain: TypedDataDomain, types: Record<string, TypedDataField[]>, value: Record<string, any>): Promise<string>;
	populateAuthorization(auth: AuthorizationRequest): Promise<AuthorizationRequest>;
	authorize(authorization: AuthorizationRequest): Promise<Authorization>;
}
/**
 * Helper function to check if a directory is accessible and writable.
 * Returns true if access is allowed, false otherwise.
 */
export declare function checkAccess(dir: string): Promise<boolean>;
export declare function existsAsync(fileOrDir: string): Promise<boolean>;
/**
 * Checks whether a contract exists at a given address.
 * @param signerOrProvider The signer or provider to use for the check.
 * @param address Address to query.
 * @returns Promise resolving to true if code is present, false otherwise.
 */
export declare function hasCode(signerOrProvider: Signer | Provider, address: string): Promise<boolean>;
/**
 * Get signers, optionally wrapped as ProxySigner with provided options.
 * Also deploys the Multicall contract if needed.
 * @param options ProxySigner configuration options.
 * @returns Promise resolving to an array of ProxySigners.
 */
export declare function getSigners(options?: ProxySignerOptions): Promise<ProxySigner[]>;
/**
 * Deploys a mock ERC20 contract for testing.
 * @param signer Signer to use for deployment.
 * @param name Token name.
 * @param symbol Token symbol.
 * @param decimals Number of decimals.
 * @param supply Initial supply.
 * @returns Promise resolving to an ERC20 instance.
 */
export declare function deployERC20(signer: Signer, name?: string, symbol?: string, decimals?: number, supply?: string | number): Promise<ERC20>;

export {};
