import { webcrypto } from 'crypto';
import { AbstractProvider, AddressLike, Authorization, AuthorizationRequest, BaseContract, BigNumberish, Block, BlockParams, BlockTag, BrowserProvider as ethBrowserProvider, BrowserProviderOptions, BytesLike, ContractEventName, ContractMethod, ContractRunner, ContractTransaction, ContractTransactionResponse, DeferredTopicFilter, Eip1193Provider, EnsResolver as ethEnsResolver, EventFragment, EventLog, FeeData, FetchRequest, FunctionFragment, Interface, JsonRpcApiProviderOptions, JsonRpcProvider, JsonRpcSigner, Listener, Log, LogDescription, Network, Networkish, Overrides, PerformActionRequest, Provider, Provider as ethProvider, Result, Signature, Signer, SigningKey, TopicFilter, TransactionLike, TransactionReceipt, TransactionRequest, TransactionResponse, Typed, TypedDataDomain, TypedDataField } from 'ethers';
import { EventEmitter } from 'stream';
import { Dispatcher, RequestInit as RequestInit$1 } from 'undici-types';

export type EnsType = "ENS" | "SpaceID";
export declare const chainNames: Record<number, EnsType>;
export declare const ensRegistries: Record<number, string>;
export declare const ensUniversalResolvers: Record<number, string>;
export declare const ensStaticResolvers: Record<number, string>;
export declare const ensReverseNode: Record<number, string>;
export declare const wildcardResolvers: Set<string>;
/**
 * Optimized EnsResolver to support optimized Onchain / Offchain Resolvers within a single contract call if possible
 * Also supports Basenames
 * (Can also batch requests through Multicall3 if provider supports)
 */
export declare class EnsResolver extends ethEnsResolver {
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
type Overrides$1<S extends StateMutability> = S extends "nonpayable" ? NonPayableOverrides : S extends "payable" ? PayableOverrides : ViewOverrides;
export type PostfixOverrides<A extends Array<any>, S extends StateMutability> = A | [
	...A,
	Overrides$1<S>
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
export declare namespace CreateX {
	type ValuesStruct = {
		constructorAmount: BigNumberish;
		initCallAmount: BigNumberish;
	};
	type ValuesStructOutput = [
		constructorAmount: bigint,
		initCallAmount: bigint
	] & {
		constructorAmount: bigint;
		initCallAmount: bigint;
	};
}
export interface CreateXInterface extends Interface {
	getFunction(nameOrSignature: "computeCreate2Address(bytes32,bytes32)" | "computeCreate2Address(bytes32,bytes32,address)" | "computeCreate3Address(bytes32,address)" | "computeCreate3Address(bytes32)" | "computeCreateAddress(uint256)" | "computeCreateAddress(address,uint256)" | "deployCreate" | "deployCreate2(bytes32,bytes)" | "deployCreate2(bytes)" | "deployCreate2AndInit(bytes32,bytes,bytes,(uint256,uint256),address)" | "deployCreate2AndInit(bytes,bytes,(uint256,uint256))" | "deployCreate2AndInit(bytes,bytes,(uint256,uint256),address)" | "deployCreate2AndInit(bytes32,bytes,bytes,(uint256,uint256))" | "deployCreate2Clone(bytes32,address,bytes)" | "deployCreate2Clone(address,bytes)" | "deployCreate3(bytes)" | "deployCreate3(bytes32,bytes)" | "deployCreate3AndInit(bytes32,bytes,bytes,(uint256,uint256))" | "deployCreate3AndInit(bytes,bytes,(uint256,uint256))" | "deployCreate3AndInit(bytes32,bytes,bytes,(uint256,uint256),address)" | "deployCreate3AndInit(bytes,bytes,(uint256,uint256),address)" | "deployCreateAndInit(bytes,bytes,(uint256,uint256))" | "deployCreateAndInit(bytes,bytes,(uint256,uint256),address)" | "deployCreateClone"): FunctionFragment;
	getEvent(nameOrSignatureOrTopic: "ContractCreation(address,bytes32)" | "ContractCreation(address)" | "Create3ProxyContractCreation"): EventFragment;
	encodeFunctionData(functionFragment: "computeCreate2Address(bytes32,bytes32)", values: [
		BytesLike,
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "computeCreate2Address(bytes32,bytes32,address)", values: [
		BytesLike,
		BytesLike,
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "computeCreate3Address(bytes32,address)", values: [
		BytesLike,
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "computeCreate3Address(bytes32)", values: [
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "computeCreateAddress(uint256)", values: [
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "computeCreateAddress(address,uint256)", values: [
		AddressLike,
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "deployCreate", values: [
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "deployCreate2(bytes32,bytes)", values: [
		BytesLike,
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "deployCreate2(bytes)", values: [
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "deployCreate2AndInit(bytes32,bytes,bytes,(uint256,uint256),address)", values: [
		BytesLike,
		BytesLike,
		BytesLike,
		CreateX.ValuesStruct,
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "deployCreate2AndInit(bytes,bytes,(uint256,uint256))", values: [
		BytesLike,
		BytesLike,
		CreateX.ValuesStruct
	]): string;
	encodeFunctionData(functionFragment: "deployCreate2AndInit(bytes,bytes,(uint256,uint256),address)", values: [
		BytesLike,
		BytesLike,
		CreateX.ValuesStruct,
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "deployCreate2AndInit(bytes32,bytes,bytes,(uint256,uint256))", values: [
		BytesLike,
		BytesLike,
		BytesLike,
		CreateX.ValuesStruct
	]): string;
	encodeFunctionData(functionFragment: "deployCreate2Clone(bytes32,address,bytes)", values: [
		BytesLike,
		AddressLike,
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "deployCreate2Clone(address,bytes)", values: [
		AddressLike,
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "deployCreate3(bytes)", values: [
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "deployCreate3(bytes32,bytes)", values: [
		BytesLike,
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "deployCreate3AndInit(bytes32,bytes,bytes,(uint256,uint256))", values: [
		BytesLike,
		BytesLike,
		BytesLike,
		CreateX.ValuesStruct
	]): string;
	encodeFunctionData(functionFragment: "deployCreate3AndInit(bytes,bytes,(uint256,uint256))", values: [
		BytesLike,
		BytesLike,
		CreateX.ValuesStruct
	]): string;
	encodeFunctionData(functionFragment: "deployCreate3AndInit(bytes32,bytes,bytes,(uint256,uint256),address)", values: [
		BytesLike,
		BytesLike,
		BytesLike,
		CreateX.ValuesStruct,
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "deployCreate3AndInit(bytes,bytes,(uint256,uint256),address)", values: [
		BytesLike,
		BytesLike,
		CreateX.ValuesStruct,
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "deployCreateAndInit(bytes,bytes,(uint256,uint256))", values: [
		BytesLike,
		BytesLike,
		CreateX.ValuesStruct
	]): string;
	encodeFunctionData(functionFragment: "deployCreateAndInit(bytes,bytes,(uint256,uint256),address)", values: [
		BytesLike,
		BytesLike,
		CreateX.ValuesStruct,
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "deployCreateClone", values: [
		AddressLike,
		BytesLike
	]): string;
	decodeFunctionResult(functionFragment: "computeCreate2Address(bytes32,bytes32)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "computeCreate2Address(bytes32,bytes32,address)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "computeCreate3Address(bytes32,address)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "computeCreate3Address(bytes32)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "computeCreateAddress(uint256)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "computeCreateAddress(address,uint256)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreate", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreate2(bytes32,bytes)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreate2(bytes)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreate2AndInit(bytes32,bytes,bytes,(uint256,uint256),address)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreate2AndInit(bytes,bytes,(uint256,uint256))", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreate2AndInit(bytes,bytes,(uint256,uint256),address)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreate2AndInit(bytes32,bytes,bytes,(uint256,uint256))", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreate2Clone(bytes32,address,bytes)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreate2Clone(address,bytes)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreate3(bytes)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreate3(bytes32,bytes)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreate3AndInit(bytes32,bytes,bytes,(uint256,uint256))", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreate3AndInit(bytes,bytes,(uint256,uint256))", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreate3AndInit(bytes32,bytes,bytes,(uint256,uint256),address)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreate3AndInit(bytes,bytes,(uint256,uint256),address)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreateAndInit(bytes,bytes,(uint256,uint256))", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreateAndInit(bytes,bytes,(uint256,uint256),address)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deployCreateClone", data: BytesLike): Result;
}
declare namespace ContractCreation_address_bytes32_Event {
	type InputTuple = [
		newContract: AddressLike,
		salt: BytesLike
	];
	type OutputTuple = [
		newContract: string,
		salt: string
	];
	interface OutputObject {
		newContract: string;
		salt: string;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
declare namespace ContractCreation_address_Event {
	type InputTuple = [
		newContract: AddressLike
	];
	type OutputTuple = [
		newContract: string
	];
	interface OutputObject {
		newContract: string;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
declare namespace Create3ProxyContractCreationEvent {
	type InputTuple = [
		newContract: AddressLike,
		salt: BytesLike
	];
	type OutputTuple = [
		newContract: string,
		salt: string
	];
	interface OutputObject {
		newContract: string;
		salt: string;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
export interface CreateX extends BaseContract {
	connect(runner?: ContractRunner | null): CreateX;
	waitForDeployment(): Promise<this>;
	interface: CreateXInterface;
	queryFilter<TCEvent extends TypedContractEvent>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
	queryFilter<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
	on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
	on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
	once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
	once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
	listeners<TCEvent extends TypedContractEvent>(event: TCEvent): Promise<Array<TypedListener<TCEvent>>>;
	listeners(eventName?: string): Promise<Array<Listener>>;
	removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
	"computeCreate2Address(bytes32,bytes32)": TypedContractMethod<[
		salt: BytesLike,
		initCodeHash: BytesLike
	], [
		string
	], "view">;
	"computeCreate2Address(bytes32,bytes32,address)": TypedContractMethod<[
		salt: BytesLike,
		initCodeHash: BytesLike,
		deployer: AddressLike
	], [
		string
	], "view">;
	"computeCreate3Address(bytes32,address)": TypedContractMethod<[
		salt: BytesLike,
		deployer: AddressLike
	], [
		string
	], "view">;
	"computeCreate3Address(bytes32)": TypedContractMethod<[
		salt: BytesLike
	], [
		string
	], "view">;
	"computeCreateAddress(uint256)": TypedContractMethod<[
		nonce: BigNumberish
	], [
		string
	], "view">;
	"computeCreateAddress(address,uint256)": TypedContractMethod<[
		deployer: AddressLike,
		nonce: BigNumberish
	], [
		string
	], "view">;
	deployCreate: TypedContractMethod<[
		initCode: BytesLike
	], [
		string
	], "payable">;
	"deployCreate2(bytes32,bytes)": TypedContractMethod<[
		salt: BytesLike,
		initCode: BytesLike
	], [
		string
	], "payable">;
	"deployCreate2(bytes)": TypedContractMethod<[
		initCode: BytesLike
	], [
		string
	], "payable">;
	"deployCreate2AndInit(bytes32,bytes,bytes,(uint256,uint256),address)": TypedContractMethod<[
		salt: BytesLike,
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct,
		refundAddress: AddressLike
	], [
		string
	], "payable">;
	"deployCreate2AndInit(bytes,bytes,(uint256,uint256))": TypedContractMethod<[
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct
	], [
		string
	], "payable">;
	"deployCreate2AndInit(bytes,bytes,(uint256,uint256),address)": TypedContractMethod<[
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct,
		refundAddress: AddressLike
	], [
		string
	], "payable">;
	"deployCreate2AndInit(bytes32,bytes,bytes,(uint256,uint256))": TypedContractMethod<[
		salt: BytesLike,
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct
	], [
		string
	], "payable">;
	"deployCreate2Clone(bytes32,address,bytes)": TypedContractMethod<[
		salt: BytesLike,
		implementation: AddressLike,
		data: BytesLike
	], [
		string
	], "payable">;
	"deployCreate2Clone(address,bytes)": TypedContractMethod<[
		implementation: AddressLike,
		data: BytesLike
	], [
		string
	], "payable">;
	"deployCreate3(bytes)": TypedContractMethod<[
		initCode: BytesLike
	], [
		string
	], "payable">;
	"deployCreate3(bytes32,bytes)": TypedContractMethod<[
		salt: BytesLike,
		initCode: BytesLike
	], [
		string
	], "payable">;
	"deployCreate3AndInit(bytes32,bytes,bytes,(uint256,uint256))": TypedContractMethod<[
		salt: BytesLike,
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct
	], [
		string
	], "payable">;
	"deployCreate3AndInit(bytes,bytes,(uint256,uint256))": TypedContractMethod<[
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct
	], [
		string
	], "payable">;
	"deployCreate3AndInit(bytes32,bytes,bytes,(uint256,uint256),address)": TypedContractMethod<[
		salt: BytesLike,
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct,
		refundAddress: AddressLike
	], [
		string
	], "payable">;
	"deployCreate3AndInit(bytes,bytes,(uint256,uint256),address)": TypedContractMethod<[
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct,
		refundAddress: AddressLike
	], [
		string
	], "payable">;
	"deployCreateAndInit(bytes,bytes,(uint256,uint256))": TypedContractMethod<[
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct
	], [
		string
	], "payable">;
	"deployCreateAndInit(bytes,bytes,(uint256,uint256),address)": TypedContractMethod<[
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct,
		refundAddress: AddressLike
	], [
		string
	], "payable">;
	deployCreateClone: TypedContractMethod<[
		implementation: AddressLike,
		data: BytesLike
	], [
		string
	], "payable">;
	getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
	getFunction(nameOrSignature: "computeCreate2Address(bytes32,bytes32)"): TypedContractMethod<[
		salt: BytesLike,
		initCodeHash: BytesLike
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "computeCreate2Address(bytes32,bytes32,address)"): TypedContractMethod<[
		salt: BytesLike,
		initCodeHash: BytesLike,
		deployer: AddressLike
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "computeCreate3Address(bytes32,address)"): TypedContractMethod<[
		salt: BytesLike,
		deployer: AddressLike
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "computeCreate3Address(bytes32)"): TypedContractMethod<[
		salt: BytesLike
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "computeCreateAddress(uint256)"): TypedContractMethod<[
		nonce: BigNumberish
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "computeCreateAddress(address,uint256)"): TypedContractMethod<[
		deployer: AddressLike,
		nonce: BigNumberish
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "deployCreate"): TypedContractMethod<[
		initCode: BytesLike
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreate2(bytes32,bytes)"): TypedContractMethod<[
		salt: BytesLike,
		initCode: BytesLike
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreate2(bytes)"): TypedContractMethod<[
		initCode: BytesLike
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreate2AndInit(bytes32,bytes,bytes,(uint256,uint256),address)"): TypedContractMethod<[
		salt: BytesLike,
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct,
		refundAddress: AddressLike
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreate2AndInit(bytes,bytes,(uint256,uint256))"): TypedContractMethod<[
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreate2AndInit(bytes,bytes,(uint256,uint256),address)"): TypedContractMethod<[
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct,
		refundAddress: AddressLike
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreate2AndInit(bytes32,bytes,bytes,(uint256,uint256))"): TypedContractMethod<[
		salt: BytesLike,
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreate2Clone(bytes32,address,bytes)"): TypedContractMethod<[
		salt: BytesLike,
		implementation: AddressLike,
		data: BytesLike
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreate2Clone(address,bytes)"): TypedContractMethod<[
		implementation: AddressLike,
		data: BytesLike
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreate3(bytes)"): TypedContractMethod<[
		initCode: BytesLike
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreate3(bytes32,bytes)"): TypedContractMethod<[
		salt: BytesLike,
		initCode: BytesLike
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreate3AndInit(bytes32,bytes,bytes,(uint256,uint256))"): TypedContractMethod<[
		salt: BytesLike,
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreate3AndInit(bytes,bytes,(uint256,uint256))"): TypedContractMethod<[
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreate3AndInit(bytes32,bytes,bytes,(uint256,uint256),address)"): TypedContractMethod<[
		salt: BytesLike,
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct,
		refundAddress: AddressLike
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreate3AndInit(bytes,bytes,(uint256,uint256),address)"): TypedContractMethod<[
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct,
		refundAddress: AddressLike
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreateAndInit(bytes,bytes,(uint256,uint256))"): TypedContractMethod<[
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreateAndInit(bytes,bytes,(uint256,uint256),address)"): TypedContractMethod<[
		initCode: BytesLike,
		data: BytesLike,
		values: CreateX.ValuesStruct,
		refundAddress: AddressLike
	], [
		string
	], "payable">;
	getFunction(nameOrSignature: "deployCreateClone"): TypedContractMethod<[
		implementation: AddressLike,
		data: BytesLike
	], [
		string
	], "payable">;
	getEvent(key: "ContractCreation(address,bytes32)"): TypedContractEvent<ContractCreation_address_bytes32_Event.InputTuple, ContractCreation_address_bytes32_Event.OutputTuple, ContractCreation_address_bytes32_Event.OutputObject>;
	getEvent(key: "ContractCreation(address)"): TypedContractEvent<ContractCreation_address_Event.InputTuple, ContractCreation_address_Event.OutputTuple, ContractCreation_address_Event.OutputObject>;
	getEvent(key: "Create3ProxyContractCreation"): TypedContractEvent<Create3ProxyContractCreationEvent.InputTuple, Create3ProxyContractCreationEvent.OutputTuple, Create3ProxyContractCreationEvent.OutputObject>;
	filters: {
		"ContractCreation(address,bytes32)": TypedContractEvent<ContractCreation_address_bytes32_Event.InputTuple, ContractCreation_address_bytes32_Event.OutputTuple, ContractCreation_address_bytes32_Event.OutputObject>;
		"ContractCreation(address)": TypedContractEvent<ContractCreation_address_Event.InputTuple, ContractCreation_address_Event.OutputTuple, ContractCreation_address_Event.OutputObject>;
		"Create3ProxyContractCreation(address,bytes32)": TypedContractEvent<Create3ProxyContractCreationEvent.InputTuple, Create3ProxyContractCreationEvent.OutputTuple, Create3ProxyContractCreationEvent.OutputObject>;
		Create3ProxyContractCreation: TypedContractEvent<Create3ProxyContractCreationEvent.InputTuple, Create3ProxyContractCreationEvent.OutputTuple, Create3ProxyContractCreationEvent.OutputObject>;
	};
}
export interface DataFeedInterface extends Interface {
	getFunction(nameOrSignature: "aggregator" | "decimals" | "description" | "getRoundData" | "latestRoundData" | "latestAnswer" | "latestRound" | "version"): FunctionFragment;
	encodeFunctionData(functionFragment: "aggregator", values?: undefined): string;
	encodeFunctionData(functionFragment: "decimals", values?: undefined): string;
	encodeFunctionData(functionFragment: "description", values?: undefined): string;
	encodeFunctionData(functionFragment: "getRoundData", values: [
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "latestRoundData", values?: undefined): string;
	encodeFunctionData(functionFragment: "latestAnswer", values?: undefined): string;
	encodeFunctionData(functionFragment: "latestRound", values?: undefined): string;
	encodeFunctionData(functionFragment: "version", values?: undefined): string;
	decodeFunctionResult(functionFragment: "aggregator", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "decimals", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "description", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getRoundData", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "latestRoundData", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "latestAnswer", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "latestRound", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "version", data: BytesLike): Result;
}
export interface DataFeed extends BaseContract {
	connect(runner?: ContractRunner | null): DataFeed;
	waitForDeployment(): Promise<this>;
	interface: DataFeedInterface;
	queryFilter<TCEvent extends TypedContractEvent>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
	queryFilter<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
	on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
	on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
	once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
	once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
	listeners<TCEvent extends TypedContractEvent>(event: TCEvent): Promise<Array<TypedListener<TCEvent>>>;
	listeners(eventName?: string): Promise<Array<Listener>>;
	removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
	aggregator: TypedContractMethod<[
	], [
		string
	], "view">;
	decimals: TypedContractMethod<[
	], [
		bigint
	], "view">;
	description: TypedContractMethod<[
	], [
		string
	], "view">;
	getRoundData: TypedContractMethod<[
		_roundId: BigNumberish
	], [
		[
			bigint,
			bigint,
			bigint,
			bigint,
			bigint
		] & {
			roundId: bigint;
			answer: bigint;
			startedAt: bigint;
			updatedAt: bigint;
			answeredInRound: bigint;
		}
	], "view">;
	latestRoundData: TypedContractMethod<[
	], [
		[
			bigint,
			bigint,
			bigint,
			bigint,
			bigint
		] & {
			roundId: bigint;
			answer: bigint;
			startedAt: bigint;
			updatedAt: bigint;
			answeredInRound: bigint;
		}
	], "view">;
	latestAnswer: TypedContractMethod<[
	], [
		bigint
	], "view">;
	latestRound: TypedContractMethod<[
	], [
		bigint
	], "view">;
	version: TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
	getFunction(nameOrSignature: "aggregator"): TypedContractMethod<[
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "decimals"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "description"): TypedContractMethod<[
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "getRoundData"): TypedContractMethod<[
		_roundId: BigNumberish
	], [
		[
			bigint,
			bigint,
			bigint,
			bigint,
			bigint
		] & {
			roundId: bigint;
			answer: bigint;
			startedAt: bigint;
			updatedAt: bigint;
			answeredInRound: bigint;
		}
	], "view">;
	getFunction(nameOrSignature: "latestRoundData"): TypedContractMethod<[
	], [
		[
			bigint,
			bigint,
			bigint,
			bigint,
			bigint
		] & {
			roundId: bigint;
			answer: bigint;
			startedAt: bigint;
			updatedAt: bigint;
			answeredInRound: bigint;
		}
	], "view">;
	getFunction(nameOrSignature: "latestAnswer"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "latestRound"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "version"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	filters: {};
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
declare namespace OraclePrices {
	type OraclePriceStruct = {
		rate: BigNumberish;
		weight: BigNumberish;
	};
	type OraclePriceStructOutput = [
		rate: bigint,
		weight: bigint
	] & {
		rate: bigint;
		weight: bigint;
	};
	type DataStruct = {
		maxOracleWeight: BigNumberish;
		size: BigNumberish;
		oraclePrices: OraclePrices.OraclePriceStruct[];
	};
	type DataStructOutput = [
		maxOracleWeight: bigint,
		size: bigint,
		oraclePrices: OraclePrices.OraclePriceStructOutput[]
	] & {
		maxOracleWeight: bigint;
		size: bigint;
		oraclePrices: OraclePrices.OraclePriceStructOutput[];
	};
}
export interface OffchainOracleInterface extends Interface {
	getFunction(nameOrSignature: "addConnector" | "addOracle" | "connectors" | "getRate" | "getRateToEth" | "getRateToEthWithCustomConnectors" | "getRateToEthWithThreshold" | "getRateWithCustomConnectors" | "getRateWithThreshold" | "getRatesAndWeightsToEthWithCustomConnectors" | "getRatesAndWeightsWithCustomConnectors" | "multiWrapper" | "oracles" | "owner" | "removeConnector" | "removeOracle" | "renounceOwnership" | "setMultiWrapper" | "transferOwnership"): FunctionFragment;
	getEvent(nameOrSignatureOrTopic: "ConnectorAdded" | "ConnectorRemoved" | "MultiWrapperUpdated" | "OracleAdded" | "OracleRemoved" | "OwnershipTransferred"): EventFragment;
	encodeFunctionData(functionFragment: "addConnector", values: [
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "addOracle", values: [
		AddressLike,
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "connectors", values?: undefined): string;
	encodeFunctionData(functionFragment: "getRate", values: [
		AddressLike,
		AddressLike,
		boolean
	]): string;
	encodeFunctionData(functionFragment: "getRateToEth", values: [
		AddressLike,
		boolean
	]): string;
	encodeFunctionData(functionFragment: "getRateToEthWithCustomConnectors", values: [
		AddressLike,
		boolean,
		AddressLike[],
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "getRateToEthWithThreshold", values: [
		AddressLike,
		boolean,
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "getRateWithCustomConnectors", values: [
		AddressLike,
		AddressLike,
		boolean,
		AddressLike[],
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "getRateWithThreshold", values: [
		AddressLike,
		AddressLike,
		boolean,
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "getRatesAndWeightsToEthWithCustomConnectors", values: [
		AddressLike,
		boolean,
		AddressLike[],
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "getRatesAndWeightsWithCustomConnectors", values: [
		AddressLike,
		AddressLike,
		boolean,
		AddressLike[],
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "multiWrapper", values?: undefined): string;
	encodeFunctionData(functionFragment: "oracles", values?: undefined): string;
	encodeFunctionData(functionFragment: "owner", values?: undefined): string;
	encodeFunctionData(functionFragment: "removeConnector", values: [
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "removeOracle", values: [
		AddressLike,
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "renounceOwnership", values?: undefined): string;
	encodeFunctionData(functionFragment: "setMultiWrapper", values: [
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "transferOwnership", values: [
		AddressLike
	]): string;
	decodeFunctionResult(functionFragment: "addConnector", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "addOracle", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "connectors", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getRate", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getRateToEth", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getRateToEthWithCustomConnectors", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getRateToEthWithThreshold", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getRateWithCustomConnectors", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getRateWithThreshold", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getRatesAndWeightsToEthWithCustomConnectors", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "getRatesAndWeightsWithCustomConnectors", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "multiWrapper", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "oracles", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "owner", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "removeConnector", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "removeOracle", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "renounceOwnership", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "setMultiWrapper", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "transferOwnership", data: BytesLike): Result;
}
declare namespace ConnectorAddedEvent {
	type InputTuple = [
		connector: AddressLike
	];
	type OutputTuple = [
		connector: string
	];
	interface OutputObject {
		connector: string;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
declare namespace ConnectorRemovedEvent {
	type InputTuple = [
		connector: AddressLike
	];
	type OutputTuple = [
		connector: string
	];
	interface OutputObject {
		connector: string;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
declare namespace MultiWrapperUpdatedEvent {
	type InputTuple = [
		multiWrapper: AddressLike
	];
	type OutputTuple = [
		multiWrapper: string
	];
	interface OutputObject {
		multiWrapper: string;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
declare namespace OracleAddedEvent {
	type InputTuple = [
		oracle: AddressLike,
		oracleType: BigNumberish
	];
	type OutputTuple = [
		oracle: string,
		oracleType: bigint
	];
	interface OutputObject {
		oracle: string;
		oracleType: bigint;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
declare namespace OracleRemovedEvent {
	type InputTuple = [
		oracle: AddressLike,
		oracleType: BigNumberish
	];
	type OutputTuple = [
		oracle: string,
		oracleType: bigint
	];
	interface OutputObject {
		oracle: string;
		oracleType: bigint;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
declare namespace OwnershipTransferredEvent {
	type InputTuple = [
		previousOwner: AddressLike,
		newOwner: AddressLike
	];
	type OutputTuple = [
		previousOwner: string,
		newOwner: string
	];
	interface OutputObject {
		previousOwner: string;
		newOwner: string;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
export interface OffchainOracle extends BaseContract {
	connect(runner?: ContractRunner | null): OffchainOracle;
	waitForDeployment(): Promise<this>;
	interface: OffchainOracleInterface;
	queryFilter<TCEvent extends TypedContractEvent>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
	queryFilter<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
	on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
	on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
	once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
	once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
	listeners<TCEvent extends TypedContractEvent>(event: TCEvent): Promise<Array<TypedListener<TCEvent>>>;
	listeners(eventName?: string): Promise<Array<Listener>>;
	removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
	addConnector: TypedContractMethod<[
		connector: AddressLike
	], [
		void
	], "nonpayable">;
	addOracle: TypedContractMethod<[
		oracle: AddressLike,
		oracleKind: BigNumberish
	], [
		void
	], "nonpayable">;
	connectors: TypedContractMethod<[
	], [
		string[]
	], "view">;
	getRate: TypedContractMethod<[
		srcToken: AddressLike,
		dstToken: AddressLike,
		useWrappers: boolean
	], [
		bigint
	], "view">;
	getRateToEth: TypedContractMethod<[
		srcToken: AddressLike,
		useSrcWrappers: boolean
	], [
		bigint
	], "view">;
	getRateToEthWithCustomConnectors: TypedContractMethod<[
		srcToken: AddressLike,
		useSrcWrappers: boolean,
		customConnectors: AddressLike[],
		thresholdFilter: BigNumberish
	], [
		bigint
	], "view">;
	getRateToEthWithThreshold: TypedContractMethod<[
		srcToken: AddressLike,
		useSrcWrappers: boolean,
		thresholdFilter: BigNumberish
	], [
		bigint
	], "view">;
	getRateWithCustomConnectors: TypedContractMethod<[
		srcToken: AddressLike,
		dstToken: AddressLike,
		useWrappers: boolean,
		customConnectors: AddressLike[],
		thresholdFilter: BigNumberish
	], [
		bigint
	], "view">;
	getRateWithThreshold: TypedContractMethod<[
		srcToken: AddressLike,
		dstToken: AddressLike,
		useWrappers: boolean,
		thresholdFilter: BigNumberish
	], [
		bigint
	], "view">;
	getRatesAndWeightsToEthWithCustomConnectors: TypedContractMethod<[
		srcToken: AddressLike,
		useSrcWrappers: boolean,
		customConnectors: AddressLike[],
		thresholdFilter: BigNumberish
	], [
		[
			bigint,
			OraclePrices.DataStructOutput
		] & {
			wrappedPrice: bigint;
			ratesAndWeights: OraclePrices.DataStructOutput;
		}
	], "view">;
	getRatesAndWeightsWithCustomConnectors: TypedContractMethod<[
		srcToken: AddressLike,
		dstToken: AddressLike,
		useWrappers: boolean,
		customConnectors: AddressLike[],
		thresholdFilter: BigNumberish
	], [
		[
			bigint,
			OraclePrices.DataStructOutput
		] & {
			wrappedPrice: bigint;
			ratesAndWeights: OraclePrices.DataStructOutput;
		}
	], "view">;
	multiWrapper: TypedContractMethod<[
	], [
		string
	], "view">;
	oracles: TypedContractMethod<[
	], [
		[
			string[],
			bigint[]
		] & {
			allOracles: string[];
			oracleTypes: bigint[];
		}
	], "view">;
	owner: TypedContractMethod<[
	], [
		string
	], "view">;
	removeConnector: TypedContractMethod<[
		connector: AddressLike
	], [
		void
	], "nonpayable">;
	removeOracle: TypedContractMethod<[
		oracle: AddressLike,
		oracleKind: BigNumberish
	], [
		void
	], "nonpayable">;
	renounceOwnership: TypedContractMethod<[
	], [
		void
	], "nonpayable">;
	setMultiWrapper: TypedContractMethod<[
		_multiWrapper: AddressLike
	], [
		void
	], "nonpayable">;
	transferOwnership: TypedContractMethod<[
		newOwner: AddressLike
	], [
		void
	], "nonpayable">;
	getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
	getFunction(nameOrSignature: "addConnector"): TypedContractMethod<[
		connector: AddressLike
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "addOracle"): TypedContractMethod<[
		oracle: AddressLike,
		oracleKind: BigNumberish
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "connectors"): TypedContractMethod<[
	], [
		string[]
	], "view">;
	getFunction(nameOrSignature: "getRate"): TypedContractMethod<[
		srcToken: AddressLike,
		dstToken: AddressLike,
		useWrappers: boolean
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getRateToEth"): TypedContractMethod<[
		srcToken: AddressLike,
		useSrcWrappers: boolean
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getRateToEthWithCustomConnectors"): TypedContractMethod<[
		srcToken: AddressLike,
		useSrcWrappers: boolean,
		customConnectors: AddressLike[],
		thresholdFilter: BigNumberish
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getRateToEthWithThreshold"): TypedContractMethod<[
		srcToken: AddressLike,
		useSrcWrappers: boolean,
		thresholdFilter: BigNumberish
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getRateWithCustomConnectors"): TypedContractMethod<[
		srcToken: AddressLike,
		dstToken: AddressLike,
		useWrappers: boolean,
		customConnectors: AddressLike[],
		thresholdFilter: BigNumberish
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getRateWithThreshold"): TypedContractMethod<[
		srcToken: AddressLike,
		dstToken: AddressLike,
		useWrappers: boolean,
		thresholdFilter: BigNumberish
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "getRatesAndWeightsToEthWithCustomConnectors"): TypedContractMethod<[
		srcToken: AddressLike,
		useSrcWrappers: boolean,
		customConnectors: AddressLike[],
		thresholdFilter: BigNumberish
	], [
		[
			bigint,
			OraclePrices.DataStructOutput
		] & {
			wrappedPrice: bigint;
			ratesAndWeights: OraclePrices.DataStructOutput;
		}
	], "view">;
	getFunction(nameOrSignature: "getRatesAndWeightsWithCustomConnectors"): TypedContractMethod<[
		srcToken: AddressLike,
		dstToken: AddressLike,
		useWrappers: boolean,
		customConnectors: AddressLike[],
		thresholdFilter: BigNumberish
	], [
		[
			bigint,
			OraclePrices.DataStructOutput
		] & {
			wrappedPrice: bigint;
			ratesAndWeights: OraclePrices.DataStructOutput;
		}
	], "view">;
	getFunction(nameOrSignature: "multiWrapper"): TypedContractMethod<[
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "oracles"): TypedContractMethod<[
	], [
		[
			string[],
			bigint[]
		] & {
			allOracles: string[];
			oracleTypes: bigint[];
		}
	], "view">;
	getFunction(nameOrSignature: "owner"): TypedContractMethod<[
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "removeConnector"): TypedContractMethod<[
		connector: AddressLike
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "removeOracle"): TypedContractMethod<[
		oracle: AddressLike,
		oracleKind: BigNumberish
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "renounceOwnership"): TypedContractMethod<[
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "setMultiWrapper"): TypedContractMethod<[
		_multiWrapper: AddressLike
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "transferOwnership"): TypedContractMethod<[
		newOwner: AddressLike
	], [
		void
	], "nonpayable">;
	getEvent(key: "ConnectorAdded"): TypedContractEvent<ConnectorAddedEvent.InputTuple, ConnectorAddedEvent.OutputTuple, ConnectorAddedEvent.OutputObject>;
	getEvent(key: "ConnectorRemoved"): TypedContractEvent<ConnectorRemovedEvent.InputTuple, ConnectorRemovedEvent.OutputTuple, ConnectorRemovedEvent.OutputObject>;
	getEvent(key: "MultiWrapperUpdated"): TypedContractEvent<MultiWrapperUpdatedEvent.InputTuple, MultiWrapperUpdatedEvent.OutputTuple, MultiWrapperUpdatedEvent.OutputObject>;
	getEvent(key: "OracleAdded"): TypedContractEvent<OracleAddedEvent.InputTuple, OracleAddedEvent.OutputTuple, OracleAddedEvent.OutputObject>;
	getEvent(key: "OracleRemoved"): TypedContractEvent<OracleRemovedEvent.InputTuple, OracleRemovedEvent.OutputTuple, OracleRemovedEvent.OutputObject>;
	getEvent(key: "OwnershipTransferred"): TypedContractEvent<OwnershipTransferredEvent.InputTuple, OwnershipTransferredEvent.OutputTuple, OwnershipTransferredEvent.OutputObject>;
	filters: {
		"ConnectorAdded(address)": TypedContractEvent<ConnectorAddedEvent.InputTuple, ConnectorAddedEvent.OutputTuple, ConnectorAddedEvent.OutputObject>;
		ConnectorAdded: TypedContractEvent<ConnectorAddedEvent.InputTuple, ConnectorAddedEvent.OutputTuple, ConnectorAddedEvent.OutputObject>;
		"ConnectorRemoved(address)": TypedContractEvent<ConnectorRemovedEvent.InputTuple, ConnectorRemovedEvent.OutputTuple, ConnectorRemovedEvent.OutputObject>;
		ConnectorRemoved: TypedContractEvent<ConnectorRemovedEvent.InputTuple, ConnectorRemovedEvent.OutputTuple, ConnectorRemovedEvent.OutputObject>;
		"MultiWrapperUpdated(address)": TypedContractEvent<MultiWrapperUpdatedEvent.InputTuple, MultiWrapperUpdatedEvent.OutputTuple, MultiWrapperUpdatedEvent.OutputObject>;
		MultiWrapperUpdated: TypedContractEvent<MultiWrapperUpdatedEvent.InputTuple, MultiWrapperUpdatedEvent.OutputTuple, MultiWrapperUpdatedEvent.OutputObject>;
		"OracleAdded(address,uint8)": TypedContractEvent<OracleAddedEvent.InputTuple, OracleAddedEvent.OutputTuple, OracleAddedEvent.OutputObject>;
		OracleAdded: TypedContractEvent<OracleAddedEvent.InputTuple, OracleAddedEvent.OutputTuple, OracleAddedEvent.OutputObject>;
		"OracleRemoved(address,uint8)": TypedContractEvent<OracleRemovedEvent.InputTuple, OracleRemovedEvent.OutputTuple, OracleRemovedEvent.OutputObject>;
		OracleRemoved: TypedContractEvent<OracleRemovedEvent.InputTuple, OracleRemovedEvent.OutputTuple, OracleRemovedEvent.OutputObject>;
		"OwnershipTransferred(address,address)": TypedContractEvent<OwnershipTransferredEvent.InputTuple, OwnershipTransferredEvent.OutputTuple, OwnershipTransferredEvent.OutputObject>;
		OwnershipTransferred: TypedContractEvent<OwnershipTransferredEvent.InputTuple, OwnershipTransferredEvent.OutputTuple, OwnershipTransferredEvent.OutputObject>;
	};
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
declare namespace IAllowanceTransfer {
	type TokenSpenderPairStruct = {
		token: AddressLike;
		spender: AddressLike;
	};
	type TokenSpenderPairStructOutput = [
		token: string,
		spender: string
	] & {
		token: string;
		spender: string;
	};
	type PermitDetailsStruct = {
		token: AddressLike;
		amount: BigNumberish;
		expiration: BigNumberish;
		nonce: BigNumberish;
	};
	type PermitDetailsStructOutput = [
		token: string,
		amount: bigint,
		expiration: bigint,
		nonce: bigint
	] & {
		token: string;
		amount: bigint;
		expiration: bigint;
		nonce: bigint;
	};
	type PermitBatchStruct = {
		details: IAllowanceTransfer.PermitDetailsStruct[];
		spender: AddressLike;
		sigDeadline: BigNumberish;
	};
	type PermitBatchStructOutput = [
		details: IAllowanceTransfer.PermitDetailsStructOutput[],
		spender: string,
		sigDeadline: bigint
	] & {
		details: IAllowanceTransfer.PermitDetailsStructOutput[];
		spender: string;
		sigDeadline: bigint;
	};
	type PermitSingleStruct = {
		details: IAllowanceTransfer.PermitDetailsStruct;
		spender: AddressLike;
		sigDeadline: BigNumberish;
	};
	type PermitSingleStructOutput = [
		details: IAllowanceTransfer.PermitDetailsStructOutput,
		spender: string,
		sigDeadline: bigint
	] & {
		details: IAllowanceTransfer.PermitDetailsStructOutput;
		spender: string;
		sigDeadline: bigint;
	};
	type AllowanceTransferDetailsStruct = {
		from: AddressLike;
		to: AddressLike;
		amount: BigNumberish;
		token: AddressLike;
	};
	type AllowanceTransferDetailsStructOutput = [
		from: string,
		to: string,
		amount: bigint,
		token: string
	] & {
		from: string;
		to: string;
		amount: bigint;
		token: string;
	};
}
declare namespace ISignatureTransfer {
	type TokenPermissionsStruct = {
		token: AddressLike;
		amount: BigNumberish;
	};
	type TokenPermissionsStructOutput = [
		token: string,
		amount: bigint
	] & {
		token: string;
		amount: bigint;
	};
	type PermitTransferFromStruct = {
		permitted: ISignatureTransfer.TokenPermissionsStruct;
		nonce: BigNumberish;
		deadline: BigNumberish;
	};
	type PermitTransferFromStructOutput = [
		permitted: ISignatureTransfer.TokenPermissionsStructOutput,
		nonce: bigint,
		deadline: bigint
	] & {
		permitted: ISignatureTransfer.TokenPermissionsStructOutput;
		nonce: bigint;
		deadline: bigint;
	};
	type SignatureTransferDetailsStruct = {
		to: AddressLike;
		requestedAmount: BigNumberish;
	};
	type SignatureTransferDetailsStructOutput = [
		to: string,
		requestedAmount: bigint
	] & {
		to: string;
		requestedAmount: bigint;
	};
	type PermitBatchTransferFromStruct = {
		permitted: ISignatureTransfer.TokenPermissionsStruct[];
		nonce: BigNumberish;
		deadline: BigNumberish;
	};
	type PermitBatchTransferFromStructOutput = [
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
	getFunction(nameOrSignature: "DOMAIN_SEPARATOR" | "allowance" | "approve" | "invalidateNonces" | "invalidateUnorderedNonces" | "lockdown" | "nonceBitmap" | "permit(address,((address,uint160,uint48,uint48)[],address,uint256),bytes)" | "permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)" | "permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)" | "permitTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes)" | "permitWitnessTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes32,string,bytes)" | "permitWitnessTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes32,string,bytes)" | "transferFrom((address,address,uint160,address)[])" | "transferFrom(address,address,uint160,address)"): FunctionFragment;
	getEvent(nameOrSignatureOrTopic: "Approval" | "Lockdown" | "NonceInvalidation" | "Permit" | "UnorderedNonceInvalidation"): EventFragment;
	encodeFunctionData(functionFragment: "DOMAIN_SEPARATOR", values?: undefined): string;
	encodeFunctionData(functionFragment: "allowance", values: [
		AddressLike,
		AddressLike,
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "approve", values: [
		AddressLike,
		AddressLike,
		BigNumberish,
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "invalidateNonces", values: [
		AddressLike,
		AddressLike,
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "invalidateUnorderedNonces", values: [
		BigNumberish,
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "lockdown", values: [
		IAllowanceTransfer.TokenSpenderPairStruct[]
	]): string;
	encodeFunctionData(functionFragment: "nonceBitmap", values: [
		AddressLike,
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "permit(address,((address,uint160,uint48,uint48)[],address,uint256),bytes)", values: [
		AddressLike,
		IAllowanceTransfer.PermitBatchStruct,
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)", values: [
		AddressLike,
		IAllowanceTransfer.PermitSingleStruct,
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)", values: [
		ISignatureTransfer.PermitTransferFromStruct,
		ISignatureTransfer.SignatureTransferDetailsStruct,
		AddressLike,
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "permitTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes)", values: [
		ISignatureTransfer.PermitBatchTransferFromStruct,
		ISignatureTransfer.SignatureTransferDetailsStruct[],
		AddressLike,
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "permitWitnessTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes32,string,bytes)", values: [
		ISignatureTransfer.PermitTransferFromStruct,
		ISignatureTransfer.SignatureTransferDetailsStruct,
		AddressLike,
		BytesLike,
		string,
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "permitWitnessTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes32,string,bytes)", values: [
		ISignatureTransfer.PermitBatchTransferFromStruct,
		ISignatureTransfer.SignatureTransferDetailsStruct[],
		AddressLike,
		BytesLike,
		string,
		BytesLike
	]): string;
	encodeFunctionData(functionFragment: "transferFrom((address,address,uint160,address)[])", values: [
		IAllowanceTransfer.AllowanceTransferDetailsStruct[]
	]): string;
	encodeFunctionData(functionFragment: "transferFrom(address,address,uint160,address)", values: [
		AddressLike,
		AddressLike,
		BigNumberish,
		AddressLike
	]): string;
	decodeFunctionResult(functionFragment: "DOMAIN_SEPARATOR", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "allowance", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "approve", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "invalidateNonces", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "invalidateUnorderedNonces", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "lockdown", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "nonceBitmap", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "permit(address,((address,uint160,uint48,uint48)[],address,uint256),bytes)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "permitTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "permitWitnessTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes32,string,bytes)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "permitWitnessTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes32,string,bytes)", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "transferFrom((address,address,uint160,address)[])", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "transferFrom(address,address,uint160,address)", data: BytesLike): Result;
}
declare namespace ApprovalEvent$1 {
	type InputTuple = [
		owner: AddressLike,
		token: AddressLike,
		spender: AddressLike,
		amount: BigNumberish,
		expiration: BigNumberish
	];
	type OutputTuple = [
		owner: string,
		token: string,
		spender: string,
		amount: bigint,
		expiration: bigint
	];
	interface OutputObject {
		owner: string;
		token: string;
		spender: string;
		amount: bigint;
		expiration: bigint;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
declare namespace LockdownEvent {
	type InputTuple = [
		owner: AddressLike,
		token: AddressLike,
		spender: AddressLike
	];
	type OutputTuple = [
		owner: string,
		token: string,
		spender: string
	];
	interface OutputObject {
		owner: string;
		token: string;
		spender: string;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
declare namespace NonceInvalidationEvent {
	type InputTuple = [
		owner: AddressLike,
		token: AddressLike,
		spender: AddressLike,
		newNonce: BigNumberish,
		oldNonce: BigNumberish
	];
	type OutputTuple = [
		owner: string,
		token: string,
		spender: string,
		newNonce: bigint,
		oldNonce: bigint
	];
	interface OutputObject {
		owner: string;
		token: string;
		spender: string;
		newNonce: bigint;
		oldNonce: bigint;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
declare namespace PermitEvent {
	type InputTuple = [
		owner: AddressLike,
		token: AddressLike,
		spender: AddressLike,
		amount: BigNumberish,
		expiration: BigNumberish,
		nonce: BigNumberish
	];
	type OutputTuple = [
		owner: string,
		token: string,
		spender: string,
		amount: bigint,
		expiration: bigint,
		nonce: bigint
	];
	interface OutputObject {
		owner: string;
		token: string;
		spender: string;
		amount: bigint;
		expiration: bigint;
		nonce: bigint;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
declare namespace UnorderedNonceInvalidationEvent {
	type InputTuple = [
		owner: AddressLike,
		word: BigNumberish,
		mask: BigNumberish
	];
	type OutputTuple = [
		owner: string,
		word: bigint,
		mask: bigint
	];
	interface OutputObject {
		owner: string;
		word: bigint;
		mask: bigint;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
export interface Permit2 extends BaseContract {
	connect(runner?: ContractRunner | null): Permit2;
	waitForDeployment(): Promise<this>;
	interface: Permit2Interface;
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
		arg0: AddressLike,
		arg1: AddressLike,
		arg2: AddressLike
	], [
		[
			bigint,
			bigint,
			bigint
		] & {
			amount: bigint;
			expiration: bigint;
			nonce: bigint;
		}
	], "view">;
	approve: TypedContractMethod<[
		token: AddressLike,
		spender: AddressLike,
		amount: BigNumberish,
		expiration: BigNumberish
	], [
		void
	], "nonpayable">;
	invalidateNonces: TypedContractMethod<[
		token: AddressLike,
		spender: AddressLike,
		newNonce: BigNumberish
	], [
		void
	], "nonpayable">;
	invalidateUnorderedNonces: TypedContractMethod<[
		wordPos: BigNumberish,
		mask: BigNumberish
	], [
		void
	], "nonpayable">;
	lockdown: TypedContractMethod<[
		approvals: IAllowanceTransfer.TokenSpenderPairStruct[]
	], [
		void
	], "nonpayable">;
	nonceBitmap: TypedContractMethod<[
		arg0: AddressLike,
		arg1: BigNumberish
	], [
		bigint
	], "view">;
	"permit(address,((address,uint160,uint48,uint48)[],address,uint256),bytes)": TypedContractMethod<[
		owner: AddressLike,
		permitBatch: IAllowanceTransfer.PermitBatchStruct,
		signature: BytesLike
	], [
		void
	], "nonpayable">;
	"permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)": TypedContractMethod<[
		owner: AddressLike,
		permitSingle: IAllowanceTransfer.PermitSingleStruct,
		signature: BytesLike
	], [
		void
	], "nonpayable">;
	"permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)": TypedContractMethod<[
		permit: ISignatureTransfer.PermitTransferFromStruct,
		transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct,
		owner: AddressLike,
		signature: BytesLike
	], [
		void
	], "nonpayable">;
	"permitTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes)": TypedContractMethod<[
		permit: ISignatureTransfer.PermitBatchTransferFromStruct,
		transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct[],
		owner: AddressLike,
		signature: BytesLike
	], [
		void
	], "nonpayable">;
	"permitWitnessTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes32,string,bytes)": TypedContractMethod<[
		permit: ISignatureTransfer.PermitTransferFromStruct,
		transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct,
		owner: AddressLike,
		witness: BytesLike,
		witnessTypeString: string,
		signature: BytesLike
	], [
		void
	], "nonpayable">;
	"permitWitnessTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes32,string,bytes)": TypedContractMethod<[
		permit: ISignatureTransfer.PermitBatchTransferFromStruct,
		transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct[],
		owner: AddressLike,
		witness: BytesLike,
		witnessTypeString: string,
		signature: BytesLike
	], [
		void
	], "nonpayable">;
	"transferFrom((address,address,uint160,address)[])": TypedContractMethod<[
		transferDetails: IAllowanceTransfer.AllowanceTransferDetailsStruct[]
	], [
		void
	], "nonpayable">;
	"transferFrom(address,address,uint160,address)": TypedContractMethod<[
		from: AddressLike,
		to: AddressLike,
		amount: BigNumberish,
		token: AddressLike
	], [
		void
	], "nonpayable">;
	getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
	getFunction(nameOrSignature: "DOMAIN_SEPARATOR"): TypedContractMethod<[
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "allowance"): TypedContractMethod<[
		arg0: AddressLike,
		arg1: AddressLike,
		arg2: AddressLike
	], [
		[
			bigint,
			bigint,
			bigint
		] & {
			amount: bigint;
			expiration: bigint;
			nonce: bigint;
		}
	], "view">;
	getFunction(nameOrSignature: "approve"): TypedContractMethod<[
		token: AddressLike,
		spender: AddressLike,
		amount: BigNumberish,
		expiration: BigNumberish
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "invalidateNonces"): TypedContractMethod<[
		token: AddressLike,
		spender: AddressLike,
		newNonce: BigNumberish
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "invalidateUnorderedNonces"): TypedContractMethod<[
		wordPos: BigNumberish,
		mask: BigNumberish
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "lockdown"): TypedContractMethod<[
		approvals: IAllowanceTransfer.TokenSpenderPairStruct[]
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "nonceBitmap"): TypedContractMethod<[
		arg0: AddressLike,
		arg1: BigNumberish
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "permit(address,((address,uint160,uint48,uint48)[],address,uint256),bytes)"): TypedContractMethod<[
		owner: AddressLike,
		permitBatch: IAllowanceTransfer.PermitBatchStruct,
		signature: BytesLike
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "permit(address,((address,uint160,uint48,uint48),address,uint256),bytes)"): TypedContractMethod<[
		owner: AddressLike,
		permitSingle: IAllowanceTransfer.PermitSingleStruct,
		signature: BytesLike
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "permitTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes)"): TypedContractMethod<[
		permit: ISignatureTransfer.PermitTransferFromStruct,
		transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct,
		owner: AddressLike,
		signature: BytesLike
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "permitTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes)"): TypedContractMethod<[
		permit: ISignatureTransfer.PermitBatchTransferFromStruct,
		transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct[],
		owner: AddressLike,
		signature: BytesLike
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "permitWitnessTransferFrom(((address,uint256),uint256,uint256),(address,uint256),address,bytes32,string,bytes)"): TypedContractMethod<[
		permit: ISignatureTransfer.PermitTransferFromStruct,
		transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct,
		owner: AddressLike,
		witness: BytesLike,
		witnessTypeString: string,
		signature: BytesLike
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "permitWitnessTransferFrom(((address,uint256)[],uint256,uint256),(address,uint256)[],address,bytes32,string,bytes)"): TypedContractMethod<[
		permit: ISignatureTransfer.PermitBatchTransferFromStruct,
		transferDetails: ISignatureTransfer.SignatureTransferDetailsStruct[],
		owner: AddressLike,
		witness: BytesLike,
		witnessTypeString: string,
		signature: BytesLike
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "transferFrom((address,address,uint160,address)[])"): TypedContractMethod<[
		transferDetails: IAllowanceTransfer.AllowanceTransferDetailsStruct[]
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "transferFrom(address,address,uint160,address)"): TypedContractMethod<[
		from: AddressLike,
		to: AddressLike,
		amount: BigNumberish,
		token: AddressLike
	], [
		void
	], "nonpayable">;
	getEvent(key: "Approval"): TypedContractEvent<ApprovalEvent$1.InputTuple, ApprovalEvent$1.OutputTuple, ApprovalEvent$1.OutputObject>;
	getEvent(key: "Lockdown"): TypedContractEvent<LockdownEvent.InputTuple, LockdownEvent.OutputTuple, LockdownEvent.OutputObject>;
	getEvent(key: "NonceInvalidation"): TypedContractEvent<NonceInvalidationEvent.InputTuple, NonceInvalidationEvent.OutputTuple, NonceInvalidationEvent.OutputObject>;
	getEvent(key: "Permit"): TypedContractEvent<PermitEvent.InputTuple, PermitEvent.OutputTuple, PermitEvent.OutputObject>;
	getEvent(key: "UnorderedNonceInvalidation"): TypedContractEvent<UnorderedNonceInvalidationEvent.InputTuple, UnorderedNonceInvalidationEvent.OutputTuple, UnorderedNonceInvalidationEvent.OutputObject>;
	filters: {
		"Approval(address,address,address,uint160,uint48)": TypedContractEvent<ApprovalEvent$1.InputTuple, ApprovalEvent$1.OutputTuple, ApprovalEvent$1.OutputObject>;
		Approval: TypedContractEvent<ApprovalEvent$1.InputTuple, ApprovalEvent$1.OutputTuple, ApprovalEvent$1.OutputObject>;
		"Lockdown(address,address,address)": TypedContractEvent<LockdownEvent.InputTuple, LockdownEvent.OutputTuple, LockdownEvent.OutputObject>;
		Lockdown: TypedContractEvent<LockdownEvent.InputTuple, LockdownEvent.OutputTuple, LockdownEvent.OutputObject>;
		"NonceInvalidation(address,address,address,uint48,uint48)": TypedContractEvent<NonceInvalidationEvent.InputTuple, NonceInvalidationEvent.OutputTuple, NonceInvalidationEvent.OutputObject>;
		NonceInvalidation: TypedContractEvent<NonceInvalidationEvent.InputTuple, NonceInvalidationEvent.OutputTuple, NonceInvalidationEvent.OutputObject>;
		"Permit(address,address,address,uint160,uint48,uint48)": TypedContractEvent<PermitEvent.InputTuple, PermitEvent.OutputTuple, PermitEvent.OutputObject>;
		Permit: TypedContractEvent<PermitEvent.InputTuple, PermitEvent.OutputTuple, PermitEvent.OutputObject>;
		"UnorderedNonceInvalidation(address,uint256,uint256)": TypedContractEvent<UnorderedNonceInvalidationEvent.InputTuple, UnorderedNonceInvalidationEvent.OutputTuple, UnorderedNonceInvalidationEvent.OutputObject>;
		UnorderedNonceInvalidation: TypedContractEvent<UnorderedNonceInvalidationEvent.InputTuple, UnorderedNonceInvalidationEvent.OutputTuple, UnorderedNonceInvalidationEvent.OutputObject>;
	};
}
export interface WETHInterface extends Interface {
	getFunction(nameOrSignature: "name" | "approve" | "totalSupply" | "transferFrom" | "withdraw" | "decimals" | "balanceOf" | "symbol" | "transfer" | "deposit" | "allowance"): FunctionFragment;
	getEvent(nameOrSignatureOrTopic: "Approval" | "Transfer" | "Deposit" | "Withdrawal"): EventFragment;
	encodeFunctionData(functionFragment: "name", values?: undefined): string;
	encodeFunctionData(functionFragment: "approve", values: [
		AddressLike,
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "totalSupply", values?: undefined): string;
	encodeFunctionData(functionFragment: "transferFrom", values: [
		AddressLike,
		AddressLike,
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "withdraw", values: [
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "decimals", values?: undefined): string;
	encodeFunctionData(functionFragment: "balanceOf", values: [
		AddressLike
	]): string;
	encodeFunctionData(functionFragment: "symbol", values?: undefined): string;
	encodeFunctionData(functionFragment: "transfer", values: [
		AddressLike,
		BigNumberish
	]): string;
	encodeFunctionData(functionFragment: "deposit", values?: undefined): string;
	encodeFunctionData(functionFragment: "allowance", values: [
		AddressLike,
		AddressLike
	]): string;
	decodeFunctionResult(functionFragment: "name", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "approve", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "totalSupply", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "transferFrom", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "withdraw", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "decimals", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "balanceOf", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "symbol", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "transfer", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "deposit", data: BytesLike): Result;
	decodeFunctionResult(functionFragment: "allowance", data: BytesLike): Result;
}
declare namespace ApprovalEvent$2 {
	type InputTuple = [
		src: AddressLike,
		guy: AddressLike,
		wad: BigNumberish
	];
	type OutputTuple = [
		src: string,
		guy: string,
		wad: bigint
	];
	interface OutputObject {
		src: string;
		guy: string;
		wad: bigint;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
declare namespace TransferEvent$1 {
	type InputTuple = [
		src: AddressLike,
		dst: AddressLike,
		wad: BigNumberish
	];
	type OutputTuple = [
		src: string,
		dst: string,
		wad: bigint
	];
	interface OutputObject {
		src: string;
		dst: string;
		wad: bigint;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
declare namespace DepositEvent {
	type InputTuple = [
		dst: AddressLike,
		wad: BigNumberish
	];
	type OutputTuple = [
		dst: string,
		wad: bigint
	];
	interface OutputObject {
		dst: string;
		wad: bigint;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
declare namespace WithdrawalEvent {
	type InputTuple = [
		src: AddressLike,
		wad: BigNumberish
	];
	type OutputTuple = [
		src: string,
		wad: bigint
	];
	interface OutputObject {
		src: string;
		wad: bigint;
	}
	type Event = TypedContractEvent<InputTuple, OutputTuple, OutputObject>;
	type Filter = TypedDeferredTopicFilter<Event>;
	type Log = TypedEventLog<Event>;
	type LogDescription = TypedLogDescription<Event>;
}
export interface WETH extends BaseContract {
	connect(runner?: ContractRunner | null): WETH;
	waitForDeployment(): Promise<this>;
	interface: WETHInterface;
	queryFilter<TCEvent extends TypedContractEvent>(event: TCEvent, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
	queryFilter<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, fromBlockOrBlockhash?: string | number | undefined, toBlock?: string | number | undefined): Promise<Array<TypedEventLog<TCEvent>>>;
	on<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
	on<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
	once<TCEvent extends TypedContractEvent>(event: TCEvent, listener: TypedListener<TCEvent>): Promise<this>;
	once<TCEvent extends TypedContractEvent>(filter: TypedDeferredTopicFilter<TCEvent>, listener: TypedListener<TCEvent>): Promise<this>;
	listeners<TCEvent extends TypedContractEvent>(event: TCEvent): Promise<Array<TypedListener<TCEvent>>>;
	listeners(eventName?: string): Promise<Array<Listener>>;
	removeAllListeners<TCEvent extends TypedContractEvent>(event?: TCEvent): Promise<this>;
	name: TypedContractMethod<[
	], [
		string
	], "view">;
	approve: TypedContractMethod<[
		guy: AddressLike,
		wad: BigNumberish
	], [
		boolean
	], "nonpayable">;
	totalSupply: TypedContractMethod<[
	], [
		bigint
	], "view">;
	transferFrom: TypedContractMethod<[
		src: AddressLike,
		dst: AddressLike,
		wad: BigNumberish
	], [
		boolean
	], "nonpayable">;
	withdraw: TypedContractMethod<[
		wad: BigNumberish
	], [
		void
	], "nonpayable">;
	decimals: TypedContractMethod<[
	], [
		bigint
	], "view">;
	balanceOf: TypedContractMethod<[
		arg0: AddressLike
	], [
		bigint
	], "view">;
	symbol: TypedContractMethod<[
	], [
		string
	], "view">;
	transfer: TypedContractMethod<[
		dst: AddressLike,
		wad: BigNumberish
	], [
		boolean
	], "nonpayable">;
	deposit: TypedContractMethod<[
	], [
		void
	], "payable">;
	allowance: TypedContractMethod<[
		arg0: AddressLike,
		arg1: AddressLike
	], [
		bigint
	], "view">;
	getFunction<T extends ContractMethod = ContractMethod>(key: string | FunctionFragment): T;
	getFunction(nameOrSignature: "name"): TypedContractMethod<[
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "approve"): TypedContractMethod<[
		guy: AddressLike,
		wad: BigNumberish
	], [
		boolean
	], "nonpayable">;
	getFunction(nameOrSignature: "totalSupply"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "transferFrom"): TypedContractMethod<[
		src: AddressLike,
		dst: AddressLike,
		wad: BigNumberish
	], [
		boolean
	], "nonpayable">;
	getFunction(nameOrSignature: "withdraw"): TypedContractMethod<[
		wad: BigNumberish
	], [
		void
	], "nonpayable">;
	getFunction(nameOrSignature: "decimals"): TypedContractMethod<[
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "balanceOf"): TypedContractMethod<[
		arg0: AddressLike
	], [
		bigint
	], "view">;
	getFunction(nameOrSignature: "symbol"): TypedContractMethod<[
	], [
		string
	], "view">;
	getFunction(nameOrSignature: "transfer"): TypedContractMethod<[
		dst: AddressLike,
		wad: BigNumberish
	], [
		boolean
	], "nonpayable">;
	getFunction(nameOrSignature: "deposit"): TypedContractMethod<[
	], [
		void
	], "payable">;
	getFunction(nameOrSignature: "allowance"): TypedContractMethod<[
		arg0: AddressLike,
		arg1: AddressLike
	], [
		bigint
	], "view">;
	getEvent(key: "Approval"): TypedContractEvent<ApprovalEvent$2.InputTuple, ApprovalEvent$2.OutputTuple, ApprovalEvent$2.OutputObject>;
	getEvent(key: "Transfer"): TypedContractEvent<TransferEvent$1.InputTuple, TransferEvent$1.OutputTuple, TransferEvent$1.OutputObject>;
	getEvent(key: "Deposit"): TypedContractEvent<DepositEvent.InputTuple, DepositEvent.OutputTuple, DepositEvent.OutputObject>;
	getEvent(key: "Withdrawal"): TypedContractEvent<WithdrawalEvent.InputTuple, WithdrawalEvent.OutputTuple, WithdrawalEvent.OutputObject>;
	filters: {
		"Approval(address,address,uint256)": TypedContractEvent<ApprovalEvent$2.InputTuple, ApprovalEvent$2.OutputTuple, ApprovalEvent$2.OutputObject>;
		Approval: TypedContractEvent<ApprovalEvent$2.InputTuple, ApprovalEvent$2.OutputTuple, ApprovalEvent$2.OutputObject>;
		"Transfer(address,address,uint256)": TypedContractEvent<TransferEvent$1.InputTuple, TransferEvent$1.OutputTuple, TransferEvent$1.OutputObject>;
		Transfer: TypedContractEvent<TransferEvent$1.InputTuple, TransferEvent$1.OutputTuple, TransferEvent$1.OutputObject>;
		"Deposit(address,uint256)": TypedContractEvent<DepositEvent.InputTuple, DepositEvent.OutputTuple, DepositEvent.OutputObject>;
		Deposit: TypedContractEvent<DepositEvent.InputTuple, DepositEvent.OutputTuple, DepositEvent.OutputObject>;
		"Withdrawal(address,uint256)": TypedContractEvent<WithdrawalEvent.InputTuple, WithdrawalEvent.OutputTuple, WithdrawalEvent.OutputObject>;
		Withdrawal: TypedContractEvent<WithdrawalEvent.InputTuple, WithdrawalEvent.OutputTuple, WithdrawalEvent.OutputObject>;
	};
}
export declare class CreateX__factory {
	static readonly abi: readonly [
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "emitter";
					readonly type: "address";
				}
			];
			readonly name: "FailedContractCreation";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "emitter";
					readonly type: "address";
				},
				{
					readonly internalType: "bytes";
					readonly name: "revertData";
					readonly type: "bytes";
				}
			];
			readonly name: "FailedContractInitialisation";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "emitter";
					readonly type: "address";
				},
				{
					readonly internalType: "bytes";
					readonly name: "revertData";
					readonly type: "bytes";
				}
			];
			readonly name: "FailedEtherTransfer";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "emitter";
					readonly type: "address";
				}
			];
			readonly name: "InvalidNonceValue";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "emitter";
					readonly type: "address";
				}
			];
			readonly name: "InvalidSalt";
			readonly type: "error";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				},
				{
					readonly indexed: true;
					readonly internalType: "bytes32";
					readonly name: "salt";
					readonly type: "bytes32";
				}
			];
			readonly name: "ContractCreation";
			readonly type: "event";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly name: "ContractCreation";
			readonly type: "event";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				},
				{
					readonly indexed: true;
					readonly internalType: "bytes32";
					readonly name: "salt";
					readonly type: "bytes32";
				}
			];
			readonly name: "Create3ProxyContractCreation";
			readonly type: "event";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes32";
					readonly name: "salt";
					readonly type: "bytes32";
				},
				{
					readonly internalType: "bytes32";
					readonly name: "initCodeHash";
					readonly type: "bytes32";
				}
			];
			readonly name: "computeCreate2Address";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "computedAddress";
					readonly type: "address";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes32";
					readonly name: "salt";
					readonly type: "bytes32";
				},
				{
					readonly internalType: "bytes32";
					readonly name: "initCodeHash";
					readonly type: "bytes32";
				},
				{
					readonly internalType: "address";
					readonly name: "deployer";
					readonly type: "address";
				}
			];
			readonly name: "computeCreate2Address";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "computedAddress";
					readonly type: "address";
				}
			];
			readonly stateMutability: "pure";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes32";
					readonly name: "salt";
					readonly type: "bytes32";
				},
				{
					readonly internalType: "address";
					readonly name: "deployer";
					readonly type: "address";
				}
			];
			readonly name: "computeCreate3Address";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "computedAddress";
					readonly type: "address";
				}
			];
			readonly stateMutability: "pure";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes32";
					readonly name: "salt";
					readonly type: "bytes32";
				}
			];
			readonly name: "computeCreate3Address";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "computedAddress";
					readonly type: "address";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "nonce";
					readonly type: "uint256";
				}
			];
			readonly name: "computeCreateAddress";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "computedAddress";
					readonly type: "address";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "deployer";
					readonly type: "address";
				},
				{
					readonly internalType: "uint256";
					readonly name: "nonce";
					readonly type: "uint256";
				}
			];
			readonly name: "computeCreateAddress";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "computedAddress";
					readonly type: "address";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes";
					readonly name: "initCode";
					readonly type: "bytes";
				}
			];
			readonly name: "deployCreate";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes32";
					readonly name: "salt";
					readonly type: "bytes32";
				},
				{
					readonly internalType: "bytes";
					readonly name: "initCode";
					readonly type: "bytes";
				}
			];
			readonly name: "deployCreate2";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes";
					readonly name: "initCode";
					readonly type: "bytes";
				}
			];
			readonly name: "deployCreate2";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes32";
					readonly name: "salt";
					readonly type: "bytes32";
				},
				{
					readonly internalType: "bytes";
					readonly name: "initCode";
					readonly type: "bytes";
				},
				{
					readonly internalType: "bytes";
					readonly name: "data";
					readonly type: "bytes";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "uint256";
							readonly name: "constructorAmount";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "initCallAmount";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct CreateX.Values";
					readonly name: "values";
					readonly type: "tuple";
				},
				{
					readonly internalType: "address";
					readonly name: "refundAddress";
					readonly type: "address";
				}
			];
			readonly name: "deployCreate2AndInit";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes";
					readonly name: "initCode";
					readonly type: "bytes";
				},
				{
					readonly internalType: "bytes";
					readonly name: "data";
					readonly type: "bytes";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "uint256";
							readonly name: "constructorAmount";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "initCallAmount";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct CreateX.Values";
					readonly name: "values";
					readonly type: "tuple";
				}
			];
			readonly name: "deployCreate2AndInit";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes";
					readonly name: "initCode";
					readonly type: "bytes";
				},
				{
					readonly internalType: "bytes";
					readonly name: "data";
					readonly type: "bytes";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "uint256";
							readonly name: "constructorAmount";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "initCallAmount";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct CreateX.Values";
					readonly name: "values";
					readonly type: "tuple";
				},
				{
					readonly internalType: "address";
					readonly name: "refundAddress";
					readonly type: "address";
				}
			];
			readonly name: "deployCreate2AndInit";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes32";
					readonly name: "salt";
					readonly type: "bytes32";
				},
				{
					readonly internalType: "bytes";
					readonly name: "initCode";
					readonly type: "bytes";
				},
				{
					readonly internalType: "bytes";
					readonly name: "data";
					readonly type: "bytes";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "uint256";
							readonly name: "constructorAmount";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "initCallAmount";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct CreateX.Values";
					readonly name: "values";
					readonly type: "tuple";
				}
			];
			readonly name: "deployCreate2AndInit";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes32";
					readonly name: "salt";
					readonly type: "bytes32";
				},
				{
					readonly internalType: "address";
					readonly name: "implementation";
					readonly type: "address";
				},
				{
					readonly internalType: "bytes";
					readonly name: "data";
					readonly type: "bytes";
				}
			];
			readonly name: "deployCreate2Clone";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "proxy";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "implementation";
					readonly type: "address";
				},
				{
					readonly internalType: "bytes";
					readonly name: "data";
					readonly type: "bytes";
				}
			];
			readonly name: "deployCreate2Clone";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "proxy";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes";
					readonly name: "initCode";
					readonly type: "bytes";
				}
			];
			readonly name: "deployCreate3";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes32";
					readonly name: "salt";
					readonly type: "bytes32";
				},
				{
					readonly internalType: "bytes";
					readonly name: "initCode";
					readonly type: "bytes";
				}
			];
			readonly name: "deployCreate3";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes32";
					readonly name: "salt";
					readonly type: "bytes32";
				},
				{
					readonly internalType: "bytes";
					readonly name: "initCode";
					readonly type: "bytes";
				},
				{
					readonly internalType: "bytes";
					readonly name: "data";
					readonly type: "bytes";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "uint256";
							readonly name: "constructorAmount";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "initCallAmount";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct CreateX.Values";
					readonly name: "values";
					readonly type: "tuple";
				}
			];
			readonly name: "deployCreate3AndInit";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes";
					readonly name: "initCode";
					readonly type: "bytes";
				},
				{
					readonly internalType: "bytes";
					readonly name: "data";
					readonly type: "bytes";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "uint256";
							readonly name: "constructorAmount";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "initCallAmount";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct CreateX.Values";
					readonly name: "values";
					readonly type: "tuple";
				}
			];
			readonly name: "deployCreate3AndInit";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes32";
					readonly name: "salt";
					readonly type: "bytes32";
				},
				{
					readonly internalType: "bytes";
					readonly name: "initCode";
					readonly type: "bytes";
				},
				{
					readonly internalType: "bytes";
					readonly name: "data";
					readonly type: "bytes";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "uint256";
							readonly name: "constructorAmount";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "initCallAmount";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct CreateX.Values";
					readonly name: "values";
					readonly type: "tuple";
				},
				{
					readonly internalType: "address";
					readonly name: "refundAddress";
					readonly type: "address";
				}
			];
			readonly name: "deployCreate3AndInit";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes";
					readonly name: "initCode";
					readonly type: "bytes";
				},
				{
					readonly internalType: "bytes";
					readonly name: "data";
					readonly type: "bytes";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "uint256";
							readonly name: "constructorAmount";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "initCallAmount";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct CreateX.Values";
					readonly name: "values";
					readonly type: "tuple";
				},
				{
					readonly internalType: "address";
					readonly name: "refundAddress";
					readonly type: "address";
				}
			];
			readonly name: "deployCreate3AndInit";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes";
					readonly name: "initCode";
					readonly type: "bytes";
				},
				{
					readonly internalType: "bytes";
					readonly name: "data";
					readonly type: "bytes";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "uint256";
							readonly name: "constructorAmount";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "initCallAmount";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct CreateX.Values";
					readonly name: "values";
					readonly type: "tuple";
				}
			];
			readonly name: "deployCreateAndInit";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes";
					readonly name: "initCode";
					readonly type: "bytes";
				},
				{
					readonly internalType: "bytes";
					readonly name: "data";
					readonly type: "bytes";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "uint256";
							readonly name: "constructorAmount";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "initCallAmount";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct CreateX.Values";
					readonly name: "values";
					readonly type: "tuple";
				},
				{
					readonly internalType: "address";
					readonly name: "refundAddress";
					readonly type: "address";
				}
			];
			readonly name: "deployCreateAndInit";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newContract";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "implementation";
					readonly type: "address";
				},
				{
					readonly internalType: "bytes";
					readonly name: "data";
					readonly type: "bytes";
				}
			];
			readonly name: "deployCreateClone";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "proxy";
					readonly type: "address";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		}
	];
	static createInterface(): CreateXInterface;
	static connect(address: string, runner?: ContractRunner | null): CreateX;
}
export declare class DataFeed__factory {
	static readonly abi: readonly [
		{
			readonly inputs: readonly [
			];
			readonly name: "aggregator";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "";
					readonly type: "address";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "decimals";
			readonly outputs: readonly [
				{
					readonly internalType: "uint8";
					readonly name: "";
					readonly type: "uint8";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "description";
			readonly outputs: readonly [
				{
					readonly internalType: "string";
					readonly name: "";
					readonly type: "string";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "uint80";
					readonly name: "_roundId";
					readonly type: "uint80";
				}
			];
			readonly name: "getRoundData";
			readonly outputs: readonly [
				{
					readonly internalType: "uint80";
					readonly name: "roundId";
					readonly type: "uint80";
				},
				{
					readonly internalType: "int256";
					readonly name: "answer";
					readonly type: "int256";
				},
				{
					readonly internalType: "uint256";
					readonly name: "startedAt";
					readonly type: "uint256";
				},
				{
					readonly internalType: "uint256";
					readonly name: "updatedAt";
					readonly type: "uint256";
				},
				{
					readonly internalType: "uint80";
					readonly name: "answeredInRound";
					readonly type: "uint80";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "latestRoundData";
			readonly outputs: readonly [
				{
					readonly internalType: "uint80";
					readonly name: "roundId";
					readonly type: "uint80";
				},
				{
					readonly internalType: "int256";
					readonly name: "answer";
					readonly type: "int256";
				},
				{
					readonly internalType: "uint256";
					readonly name: "startedAt";
					readonly type: "uint256";
				},
				{
					readonly internalType: "uint256";
					readonly name: "updatedAt";
					readonly type: "uint256";
				},
				{
					readonly internalType: "uint80";
					readonly name: "answeredInRound";
					readonly type: "uint80";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "latestAnswer";
			readonly outputs: readonly [
				{
					readonly internalType: "int256";
					readonly name: "";
					readonly type: "int256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "latestRound";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "version";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		}
	];
	static createInterface(): DataFeedInterface;
	static connect(address: string, runner?: ContractRunner | null): DataFeed;
}
export declare class ERC20__factory {
	static readonly abi: readonly [
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				},
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "spender";
					readonly type: "address";
				},
				{
					readonly indexed: false;
					readonly internalType: "uint256";
					readonly name: "value";
					readonly type: "uint256";
				}
			];
			readonly name: "Approval";
			readonly type: "event";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "from";
					readonly type: "address";
				},
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "to";
					readonly type: "address";
				},
				{
					readonly indexed: false;
					readonly internalType: "uint256";
					readonly name: "value";
					readonly type: "uint256";
				}
			];
			readonly name: "Transfer";
			readonly type: "event";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "DOMAIN_SEPARATOR";
			readonly outputs: readonly [
				{
					readonly internalType: "bytes32";
					readonly name: "";
					readonly type: "bytes32";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				},
				{
					readonly internalType: "address";
					readonly name: "spender";
					readonly type: "address";
				}
			];
			readonly name: "allowance";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "spender";
					readonly type: "address";
				},
				{
					readonly internalType: "uint256";
					readonly name: "value";
					readonly type: "uint256";
				}
			];
			readonly name: "approve";
			readonly outputs: readonly [
				{
					readonly internalType: "bool";
					readonly name: "";
					readonly type: "bool";
				}
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "account";
					readonly type: "address";
				}
			];
			readonly name: "balanceOf";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "decimals";
			readonly outputs: readonly [
				{
					readonly internalType: "uint8";
					readonly name: "";
					readonly type: "uint8";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "name";
			readonly outputs: readonly [
				{
					readonly internalType: "string";
					readonly name: "";
					readonly type: "string";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				}
			];
			readonly name: "nonces";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				},
				{
					readonly internalType: "address";
					readonly name: "spender";
					readonly type: "address";
				},
				{
					readonly internalType: "uint256";
					readonly name: "value";
					readonly type: "uint256";
				},
				{
					readonly internalType: "uint256";
					readonly name: "deadline";
					readonly type: "uint256";
				},
				{
					readonly internalType: "uint8";
					readonly name: "v";
					readonly type: "uint8";
				},
				{
					readonly internalType: "bytes32";
					readonly name: "r";
					readonly type: "bytes32";
				},
				{
					readonly internalType: "bytes32";
					readonly name: "s";
					readonly type: "bytes32";
				}
			];
			readonly name: "permit";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "symbol";
			readonly outputs: readonly [
				{
					readonly internalType: "string";
					readonly name: "";
					readonly type: "string";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "totalSupply";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "to";
					readonly type: "address";
				},
				{
					readonly internalType: "uint256";
					readonly name: "value";
					readonly type: "uint256";
				}
			];
			readonly name: "transfer";
			readonly outputs: readonly [
				{
					readonly internalType: "bool";
					readonly name: "";
					readonly type: "bool";
				}
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "from";
					readonly type: "address";
				},
				{
					readonly internalType: "address";
					readonly name: "to";
					readonly type: "address";
				},
				{
					readonly internalType: "uint256";
					readonly name: "value";
					readonly type: "uint256";
				}
			];
			readonly name: "transferFrom";
			readonly outputs: readonly [
				{
					readonly internalType: "bool";
					readonly name: "";
					readonly type: "bool";
				}
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		}
	];
	static createInterface(): ERC20Interface;
	static connect(address: string, runner?: ContractRunner | null): ERC20;
}
export declare class Multicall__factory {
	static readonly abi: readonly [
		{
			readonly inputs: readonly [
				{
					readonly components: readonly [
						{
							readonly internalType: "address";
							readonly name: "target";
							readonly type: "address";
						},
						{
							readonly internalType: "bytes";
							readonly name: "callData";
							readonly type: "bytes";
						}
					];
					readonly internalType: "struct Multicall3.Call[]";
					readonly name: "calls";
					readonly type: "tuple[]";
				}
			];
			readonly name: "aggregate";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "blockNumber";
					readonly type: "uint256";
				},
				{
					readonly internalType: "bytes[]";
					readonly name: "returnData";
					readonly type: "bytes[]";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly components: readonly [
						{
							readonly internalType: "address";
							readonly name: "target";
							readonly type: "address";
						},
						{
							readonly internalType: "bool";
							readonly name: "allowFailure";
							readonly type: "bool";
						},
						{
							readonly internalType: "bytes";
							readonly name: "callData";
							readonly type: "bytes";
						}
					];
					readonly internalType: "struct Multicall3.Call3[]";
					readonly name: "calls";
					readonly type: "tuple[]";
				}
			];
			readonly name: "aggregate3";
			readonly outputs: readonly [
				{
					readonly components: readonly [
						{
							readonly internalType: "bool";
							readonly name: "success";
							readonly type: "bool";
						},
						{
							readonly internalType: "bytes";
							readonly name: "returnData";
							readonly type: "bytes";
						}
					];
					readonly internalType: "struct Multicall3.Result[]";
					readonly name: "returnData";
					readonly type: "tuple[]";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly components: readonly [
						{
							readonly internalType: "address";
							readonly name: "target";
							readonly type: "address";
						},
						{
							readonly internalType: "bool";
							readonly name: "allowFailure";
							readonly type: "bool";
						},
						{
							readonly internalType: "uint256";
							readonly name: "value";
							readonly type: "uint256";
						},
						{
							readonly internalType: "bytes";
							readonly name: "callData";
							readonly type: "bytes";
						}
					];
					readonly internalType: "struct Multicall3.Call3Value[]";
					readonly name: "calls";
					readonly type: "tuple[]";
				}
			];
			readonly name: "aggregate3Value";
			readonly outputs: readonly [
				{
					readonly components: readonly [
						{
							readonly internalType: "bool";
							readonly name: "success";
							readonly type: "bool";
						},
						{
							readonly internalType: "bytes";
							readonly name: "returnData";
							readonly type: "bytes";
						}
					];
					readonly internalType: "struct Multicall3.Result[]";
					readonly name: "returnData";
					readonly type: "tuple[]";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly components: readonly [
						{
							readonly internalType: "address";
							readonly name: "target";
							readonly type: "address";
						},
						{
							readonly internalType: "bytes";
							readonly name: "callData";
							readonly type: "bytes";
						}
					];
					readonly internalType: "struct Multicall3.Call[]";
					readonly name: "calls";
					readonly type: "tuple[]";
				}
			];
			readonly name: "blockAndAggregate";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "blockNumber";
					readonly type: "uint256";
				},
				{
					readonly internalType: "bytes32";
					readonly name: "blockHash";
					readonly type: "bytes32";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "bool";
							readonly name: "success";
							readonly type: "bool";
						},
						{
							readonly internalType: "bytes";
							readonly name: "returnData";
							readonly type: "bytes";
						}
					];
					readonly internalType: "struct Multicall3.Result[]";
					readonly name: "returnData";
					readonly type: "tuple[]";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "getBasefee";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "basefee";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "blockNumber";
					readonly type: "uint256";
				}
			];
			readonly name: "getBlockHash";
			readonly outputs: readonly [
				{
					readonly internalType: "bytes32";
					readonly name: "blockHash";
					readonly type: "bytes32";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "getBlockNumber";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "blockNumber";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "getChainId";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "chainid";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "getCurrentBlockCoinbase";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "coinbase";
					readonly type: "address";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "getCurrentBlockDifficulty";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "difficulty";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "getCurrentBlockGasLimit";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "gaslimit";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "getCurrentBlockTimestamp";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "timestamp";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "addr";
					readonly type: "address";
				}
			];
			readonly name: "getEthBalance";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "balance";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "getLastBlockHash";
			readonly outputs: readonly [
				{
					readonly internalType: "bytes32";
					readonly name: "blockHash";
					readonly type: "bytes32";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bool";
					readonly name: "requireSuccess";
					readonly type: "bool";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "address";
							readonly name: "target";
							readonly type: "address";
						},
						{
							readonly internalType: "bytes";
							readonly name: "callData";
							readonly type: "bytes";
						}
					];
					readonly internalType: "struct Multicall3.Call[]";
					readonly name: "calls";
					readonly type: "tuple[]";
				}
			];
			readonly name: "tryAggregate";
			readonly outputs: readonly [
				{
					readonly components: readonly [
						{
							readonly internalType: "bool";
							readonly name: "success";
							readonly type: "bool";
						},
						{
							readonly internalType: "bytes";
							readonly name: "returnData";
							readonly type: "bytes";
						}
					];
					readonly internalType: "struct Multicall3.Result[]";
					readonly name: "returnData";
					readonly type: "tuple[]";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bool";
					readonly name: "requireSuccess";
					readonly type: "bool";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "address";
							readonly name: "target";
							readonly type: "address";
						},
						{
							readonly internalType: "bytes";
							readonly name: "callData";
							readonly type: "bytes";
						}
					];
					readonly internalType: "struct Multicall3.Call[]";
					readonly name: "calls";
					readonly type: "tuple[]";
				}
			];
			readonly name: "tryBlockAndAggregate";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "blockNumber";
					readonly type: "uint256";
				},
				{
					readonly internalType: "bytes32";
					readonly name: "blockHash";
					readonly type: "bytes32";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "bool";
							readonly name: "success";
							readonly type: "bool";
						},
						{
							readonly internalType: "bytes";
							readonly name: "returnData";
							readonly type: "bytes";
						}
					];
					readonly internalType: "struct Multicall3.Result[]";
					readonly name: "returnData";
					readonly type: "tuple[]";
				}
			];
			readonly stateMutability: "payable";
			readonly type: "function";
		}
	];
	static createInterface(): MulticallInterface;
	static connect(address: string, runner?: ContractRunner | null): Multicall;
}
export declare class OffchainOracle__factory {
	static readonly abi: readonly [
		{
			readonly inputs: readonly [
				{
					readonly internalType: "contract MultiWrapper";
					readonly name: "_multiWrapper";
					readonly type: "address";
				},
				{
					readonly internalType: "contract IOracle[]";
					readonly name: "existingOracles";
					readonly type: "address[]";
				},
				{
					readonly internalType: "enum OffchainOracle.OracleType[]";
					readonly name: "oracleTypes";
					readonly type: "uint8[]";
				},
				{
					readonly internalType: "contract IERC20[]";
					readonly name: "existingConnectors";
					readonly type: "address[]";
				},
				{
					readonly internalType: "contract IERC20";
					readonly name: "wBase";
					readonly type: "address";
				},
				{
					readonly internalType: "address";
					readonly name: "owner_";
					readonly type: "address";
				}
			];
			readonly stateMutability: "nonpayable";
			readonly type: "constructor";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "ArraysLengthMismatch";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "ConnectorAlreadyAdded";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "InvalidOracleTokenKind";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "MathOverflowedMulDiv";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "OracleAlreadyAdded";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				}
			];
			readonly name: "OwnableInvalidOwner";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "account";
					readonly type: "address";
				}
			];
			readonly name: "OwnableUnauthorizedAccount";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "SameTokens";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "TooBigThreshold";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "UnknownConnector";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "UnknownOracle";
			readonly type: "error";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: false;
					readonly internalType: "contract IERC20";
					readonly name: "connector";
					readonly type: "address";
				}
			];
			readonly name: "ConnectorAdded";
			readonly type: "event";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: false;
					readonly internalType: "contract IERC20";
					readonly name: "connector";
					readonly type: "address";
				}
			];
			readonly name: "ConnectorRemoved";
			readonly type: "event";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: false;
					readonly internalType: "contract MultiWrapper";
					readonly name: "multiWrapper";
					readonly type: "address";
				}
			];
			readonly name: "MultiWrapperUpdated";
			readonly type: "event";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: false;
					readonly internalType: "contract IOracle";
					readonly name: "oracle";
					readonly type: "address";
				},
				{
					readonly indexed: false;
					readonly internalType: "enum OffchainOracle.OracleType";
					readonly name: "oracleType";
					readonly type: "uint8";
				}
			];
			readonly name: "OracleAdded";
			readonly type: "event";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: false;
					readonly internalType: "contract IOracle";
					readonly name: "oracle";
					readonly type: "address";
				},
				{
					readonly indexed: false;
					readonly internalType: "enum OffchainOracle.OracleType";
					readonly name: "oracleType";
					readonly type: "uint8";
				}
			];
			readonly name: "OracleRemoved";
			readonly type: "event";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "previousOwner";
					readonly type: "address";
				},
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "newOwner";
					readonly type: "address";
				}
			];
			readonly name: "OwnershipTransferred";
			readonly type: "event";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "contract IERC20";
					readonly name: "connector";
					readonly type: "address";
				}
			];
			readonly name: "addConnector";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "contract IOracle";
					readonly name: "oracle";
					readonly type: "address";
				},
				{
					readonly internalType: "enum OffchainOracle.OracleType";
					readonly name: "oracleKind";
					readonly type: "uint8";
				}
			];
			readonly name: "addOracle";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "connectors";
			readonly outputs: readonly [
				{
					readonly internalType: "contract IERC20[]";
					readonly name: "allConnectors";
					readonly type: "address[]";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "contract IERC20";
					readonly name: "srcToken";
					readonly type: "address";
				},
				{
					readonly internalType: "contract IERC20";
					readonly name: "dstToken";
					readonly type: "address";
				},
				{
					readonly internalType: "bool";
					readonly name: "useWrappers";
					readonly type: "bool";
				}
			];
			readonly name: "getRate";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "weightedRate";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "contract IERC20";
					readonly name: "srcToken";
					readonly type: "address";
				},
				{
					readonly internalType: "bool";
					readonly name: "useSrcWrappers";
					readonly type: "bool";
				}
			];
			readonly name: "getRateToEth";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "weightedRate";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "contract IERC20";
					readonly name: "srcToken";
					readonly type: "address";
				},
				{
					readonly internalType: "bool";
					readonly name: "useSrcWrappers";
					readonly type: "bool";
				},
				{
					readonly internalType: "contract IERC20[]";
					readonly name: "customConnectors";
					readonly type: "address[]";
				},
				{
					readonly internalType: "uint256";
					readonly name: "thresholdFilter";
					readonly type: "uint256";
				}
			];
			readonly name: "getRateToEthWithCustomConnectors";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "weightedRate";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "contract IERC20";
					readonly name: "srcToken";
					readonly type: "address";
				},
				{
					readonly internalType: "bool";
					readonly name: "useSrcWrappers";
					readonly type: "bool";
				},
				{
					readonly internalType: "uint256";
					readonly name: "thresholdFilter";
					readonly type: "uint256";
				}
			];
			readonly name: "getRateToEthWithThreshold";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "weightedRate";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "contract IERC20";
					readonly name: "srcToken";
					readonly type: "address";
				},
				{
					readonly internalType: "contract IERC20";
					readonly name: "dstToken";
					readonly type: "address";
				},
				{
					readonly internalType: "bool";
					readonly name: "useWrappers";
					readonly type: "bool";
				},
				{
					readonly internalType: "contract IERC20[]";
					readonly name: "customConnectors";
					readonly type: "address[]";
				},
				{
					readonly internalType: "uint256";
					readonly name: "thresholdFilter";
					readonly type: "uint256";
				}
			];
			readonly name: "getRateWithCustomConnectors";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "weightedRate";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "contract IERC20";
					readonly name: "srcToken";
					readonly type: "address";
				},
				{
					readonly internalType: "contract IERC20";
					readonly name: "dstToken";
					readonly type: "address";
				},
				{
					readonly internalType: "bool";
					readonly name: "useWrappers";
					readonly type: "bool";
				},
				{
					readonly internalType: "uint256";
					readonly name: "thresholdFilter";
					readonly type: "uint256";
				}
			];
			readonly name: "getRateWithThreshold";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "weightedRate";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "contract IERC20";
					readonly name: "srcToken";
					readonly type: "address";
				},
				{
					readonly internalType: "bool";
					readonly name: "useSrcWrappers";
					readonly type: "bool";
				},
				{
					readonly internalType: "contract IERC20[]";
					readonly name: "customConnectors";
					readonly type: "address[]";
				},
				{
					readonly internalType: "uint256";
					readonly name: "thresholdFilter";
					readonly type: "uint256";
				}
			];
			readonly name: "getRatesAndWeightsToEthWithCustomConnectors";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "wrappedPrice";
					readonly type: "uint256";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "uint256";
							readonly name: "maxOracleWeight";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "size";
							readonly type: "uint256";
						},
						{
							readonly components: readonly [
								{
									readonly internalType: "uint256";
									readonly name: "rate";
									readonly type: "uint256";
								},
								{
									readonly internalType: "uint256";
									readonly name: "weight";
									readonly type: "uint256";
								}
							];
							readonly internalType: "struct OraclePrices.OraclePrice[]";
							readonly name: "oraclePrices";
							readonly type: "tuple[]";
						}
					];
					readonly internalType: "struct OraclePrices.Data";
					readonly name: "ratesAndWeights";
					readonly type: "tuple";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "contract IERC20";
					readonly name: "srcToken";
					readonly type: "address";
				},
				{
					readonly internalType: "contract IERC20";
					readonly name: "dstToken";
					readonly type: "address";
				},
				{
					readonly internalType: "bool";
					readonly name: "useWrappers";
					readonly type: "bool";
				},
				{
					readonly internalType: "contract IERC20[]";
					readonly name: "customConnectors";
					readonly type: "address[]";
				},
				{
					readonly internalType: "uint256";
					readonly name: "thresholdFilter";
					readonly type: "uint256";
				}
			];
			readonly name: "getRatesAndWeightsWithCustomConnectors";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "wrappedPrice";
					readonly type: "uint256";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "uint256";
							readonly name: "maxOracleWeight";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "size";
							readonly type: "uint256";
						},
						{
							readonly components: readonly [
								{
									readonly internalType: "uint256";
									readonly name: "rate";
									readonly type: "uint256";
								},
								{
									readonly internalType: "uint256";
									readonly name: "weight";
									readonly type: "uint256";
								}
							];
							readonly internalType: "struct OraclePrices.OraclePrice[]";
							readonly name: "oraclePrices";
							readonly type: "tuple[]";
						}
					];
					readonly internalType: "struct OraclePrices.Data";
					readonly name: "ratesAndWeights";
					readonly type: "tuple";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "multiWrapper";
			readonly outputs: readonly [
				{
					readonly internalType: "contract MultiWrapper";
					readonly name: "";
					readonly type: "address";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "oracles";
			readonly outputs: readonly [
				{
					readonly internalType: "contract IOracle[]";
					readonly name: "allOracles";
					readonly type: "address[]";
				},
				{
					readonly internalType: "enum OffchainOracle.OracleType[]";
					readonly name: "oracleTypes";
					readonly type: "uint8[]";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "owner";
			readonly outputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "";
					readonly type: "address";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "contract IERC20";
					readonly name: "connector";
					readonly type: "address";
				}
			];
			readonly name: "removeConnector";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "contract IOracle";
					readonly name: "oracle";
					readonly type: "address";
				},
				{
					readonly internalType: "enum OffchainOracle.OracleType";
					readonly name: "oracleKind";
					readonly type: "uint8";
				}
			];
			readonly name: "removeOracle";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "renounceOwnership";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "contract MultiWrapper";
					readonly name: "_multiWrapper";
					readonly type: "address";
				}
			];
			readonly name: "setMultiWrapper";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "newOwner";
					readonly type: "address";
				}
			];
			readonly name: "transferOwnership";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		}
	];
	static createInterface(): OffchainOracleInterface;
	static connect(address: string, runner?: ContractRunner | null): OffchainOracle;
}
export declare class OpGasPriceOracle__factory {
	static readonly abi: readonly [
		{
			readonly inputs: readonly [
			];
			readonly name: "DECIMALS";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "baseFee";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "baseFeeScalar";
			readonly outputs: readonly [
				{
					readonly internalType: "uint32";
					readonly name: "";
					readonly type: "uint32";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "blobBaseFee";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "blobBaseFeeScalar";
			readonly outputs: readonly [
				{
					readonly internalType: "uint32";
					readonly name: "";
					readonly type: "uint32";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "decimals";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "pure";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "gasPrice";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes";
					readonly name: "_data";
					readonly type: "bytes";
				}
			];
			readonly name: "getL1Fee";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "_unsignedTxSize";
					readonly type: "uint256";
				}
			];
			readonly name: "getL1FeeUpperBound";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "bytes";
					readonly name: "_data";
					readonly type: "bytes";
				}
			];
			readonly name: "getL1GasUsed";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "isEcotone";
			readonly outputs: readonly [
				{
					readonly internalType: "bool";
					readonly name: "";
					readonly type: "bool";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "isFjord";
			readonly outputs: readonly [
				{
					readonly internalType: "bool";
					readonly name: "";
					readonly type: "bool";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "l1BaseFee";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "overhead";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "scalar";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "setEcotone";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "setFjord";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "version";
			readonly outputs: readonly [
				{
					readonly internalType: "string";
					readonly name: "";
					readonly type: "string";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		}
	];
	static createInterface(): OpGasPriceOracleInterface;
	static connect(address: string, runner?: ContractRunner | null): OpGasPriceOracle;
}
export declare class Permit2__factory {
	static readonly abi: readonly [
		{
			readonly inputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "deadline";
					readonly type: "uint256";
				}
			];
			readonly name: "AllowanceExpired";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "ExcessiveInvalidation";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "amount";
					readonly type: "uint256";
				}
			];
			readonly name: "InsufficientAllowance";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "maxAmount";
					readonly type: "uint256";
				}
			];
			readonly name: "InvalidAmount";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "InvalidContractSignature";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "InvalidNonce";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "InvalidSignature";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "InvalidSignatureLength";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "InvalidSigner";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "LengthMismatch";
			readonly type: "error";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "signatureDeadline";
					readonly type: "uint256";
				}
			];
			readonly name: "SignatureExpired";
			readonly type: "error";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				},
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "token";
					readonly type: "address";
				},
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "spender";
					readonly type: "address";
				},
				{
					readonly indexed: false;
					readonly internalType: "uint160";
					readonly name: "amount";
					readonly type: "uint160";
				},
				{
					readonly indexed: false;
					readonly internalType: "uint48";
					readonly name: "expiration";
					readonly type: "uint48";
				}
			];
			readonly name: "Approval";
			readonly type: "event";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				},
				{
					readonly indexed: false;
					readonly internalType: "address";
					readonly name: "token";
					readonly type: "address";
				},
				{
					readonly indexed: false;
					readonly internalType: "address";
					readonly name: "spender";
					readonly type: "address";
				}
			];
			readonly name: "Lockdown";
			readonly type: "event";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				},
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "token";
					readonly type: "address";
				},
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "spender";
					readonly type: "address";
				},
				{
					readonly indexed: false;
					readonly internalType: "uint48";
					readonly name: "newNonce";
					readonly type: "uint48";
				},
				{
					readonly indexed: false;
					readonly internalType: "uint48";
					readonly name: "oldNonce";
					readonly type: "uint48";
				}
			];
			readonly name: "NonceInvalidation";
			readonly type: "event";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				},
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "token";
					readonly type: "address";
				},
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "spender";
					readonly type: "address";
				},
				{
					readonly indexed: false;
					readonly internalType: "uint160";
					readonly name: "amount";
					readonly type: "uint160";
				},
				{
					readonly indexed: false;
					readonly internalType: "uint48";
					readonly name: "expiration";
					readonly type: "uint48";
				},
				{
					readonly indexed: false;
					readonly internalType: "uint48";
					readonly name: "nonce";
					readonly type: "uint48";
				}
			];
			readonly name: "Permit";
			readonly type: "event";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: true;
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				},
				{
					readonly indexed: false;
					readonly internalType: "uint256";
					readonly name: "word";
					readonly type: "uint256";
				},
				{
					readonly indexed: false;
					readonly internalType: "uint256";
					readonly name: "mask";
					readonly type: "uint256";
				}
			];
			readonly name: "UnorderedNonceInvalidation";
			readonly type: "event";
		},
		{
			readonly inputs: readonly [
			];
			readonly name: "DOMAIN_SEPARATOR";
			readonly outputs: readonly [
				{
					readonly internalType: "bytes32";
					readonly name: "";
					readonly type: "bytes32";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "";
					readonly type: "address";
				},
				{
					readonly internalType: "address";
					readonly name: "";
					readonly type: "address";
				},
				{
					readonly internalType: "address";
					readonly name: "";
					readonly type: "address";
				}
			];
			readonly name: "allowance";
			readonly outputs: readonly [
				{
					readonly internalType: "uint160";
					readonly name: "amount";
					readonly type: "uint160";
				},
				{
					readonly internalType: "uint48";
					readonly name: "expiration";
					readonly type: "uint48";
				},
				{
					readonly internalType: "uint48";
					readonly name: "nonce";
					readonly type: "uint48";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "token";
					readonly type: "address";
				},
				{
					readonly internalType: "address";
					readonly name: "spender";
					readonly type: "address";
				},
				{
					readonly internalType: "uint160";
					readonly name: "amount";
					readonly type: "uint160";
				},
				{
					readonly internalType: "uint48";
					readonly name: "expiration";
					readonly type: "uint48";
				}
			];
			readonly name: "approve";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "token";
					readonly type: "address";
				},
				{
					readonly internalType: "address";
					readonly name: "spender";
					readonly type: "address";
				},
				{
					readonly internalType: "uint48";
					readonly name: "newNonce";
					readonly type: "uint48";
				}
			];
			readonly name: "invalidateNonces";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "wordPos";
					readonly type: "uint256";
				},
				{
					readonly internalType: "uint256";
					readonly name: "mask";
					readonly type: "uint256";
				}
			];
			readonly name: "invalidateUnorderedNonces";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly components: readonly [
						{
							readonly internalType: "address";
							readonly name: "token";
							readonly type: "address";
						},
						{
							readonly internalType: "address";
							readonly name: "spender";
							readonly type: "address";
						}
					];
					readonly internalType: "struct IAllowanceTransfer.TokenSpenderPair[]";
					readonly name: "approvals";
					readonly type: "tuple[]";
				}
			];
			readonly name: "lockdown";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "";
					readonly type: "address";
				},
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly name: "nonceBitmap";
			readonly outputs: readonly [
				{
					readonly internalType: "uint256";
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				},
				{
					readonly components: readonly [
						{
							readonly components: readonly [
								{
									readonly internalType: "address";
									readonly name: "token";
									readonly type: "address";
								},
								{
									readonly internalType: "uint160";
									readonly name: "amount";
									readonly type: "uint160";
								},
								{
									readonly internalType: "uint48";
									readonly name: "expiration";
									readonly type: "uint48";
								},
								{
									readonly internalType: "uint48";
									readonly name: "nonce";
									readonly type: "uint48";
								}
							];
							readonly internalType: "struct IAllowanceTransfer.PermitDetails[]";
							readonly name: "details";
							readonly type: "tuple[]";
						},
						{
							readonly internalType: "address";
							readonly name: "spender";
							readonly type: "address";
						},
						{
							readonly internalType: "uint256";
							readonly name: "sigDeadline";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct IAllowanceTransfer.PermitBatch";
					readonly name: "permitBatch";
					readonly type: "tuple";
				},
				{
					readonly internalType: "bytes";
					readonly name: "signature";
					readonly type: "bytes";
				}
			];
			readonly name: "permit";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				},
				{
					readonly components: readonly [
						{
							readonly components: readonly [
								{
									readonly internalType: "address";
									readonly name: "token";
									readonly type: "address";
								},
								{
									readonly internalType: "uint160";
									readonly name: "amount";
									readonly type: "uint160";
								},
								{
									readonly internalType: "uint48";
									readonly name: "expiration";
									readonly type: "uint48";
								},
								{
									readonly internalType: "uint48";
									readonly name: "nonce";
									readonly type: "uint48";
								}
							];
							readonly internalType: "struct IAllowanceTransfer.PermitDetails";
							readonly name: "details";
							readonly type: "tuple";
						},
						{
							readonly internalType: "address";
							readonly name: "spender";
							readonly type: "address";
						},
						{
							readonly internalType: "uint256";
							readonly name: "sigDeadline";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct IAllowanceTransfer.PermitSingle";
					readonly name: "permitSingle";
					readonly type: "tuple";
				},
				{
					readonly internalType: "bytes";
					readonly name: "signature";
					readonly type: "bytes";
				}
			];
			readonly name: "permit";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly components: readonly [
						{
							readonly components: readonly [
								{
									readonly internalType: "address";
									readonly name: "token";
									readonly type: "address";
								},
								{
									readonly internalType: "uint256";
									readonly name: "amount";
									readonly type: "uint256";
								}
							];
							readonly internalType: "struct ISignatureTransfer.TokenPermissions";
							readonly name: "permitted";
							readonly type: "tuple";
						},
						{
							readonly internalType: "uint256";
							readonly name: "nonce";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "deadline";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct ISignatureTransfer.PermitTransferFrom";
					readonly name: "permit";
					readonly type: "tuple";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "address";
							readonly name: "to";
							readonly type: "address";
						},
						{
							readonly internalType: "uint256";
							readonly name: "requestedAmount";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct ISignatureTransfer.SignatureTransferDetails";
					readonly name: "transferDetails";
					readonly type: "tuple";
				},
				{
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				},
				{
					readonly internalType: "bytes";
					readonly name: "signature";
					readonly type: "bytes";
				}
			];
			readonly name: "permitTransferFrom";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly components: readonly [
						{
							readonly components: readonly [
								{
									readonly internalType: "address";
									readonly name: "token";
									readonly type: "address";
								},
								{
									readonly internalType: "uint256";
									readonly name: "amount";
									readonly type: "uint256";
								}
							];
							readonly internalType: "struct ISignatureTransfer.TokenPermissions[]";
							readonly name: "permitted";
							readonly type: "tuple[]";
						},
						{
							readonly internalType: "uint256";
							readonly name: "nonce";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "deadline";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct ISignatureTransfer.PermitBatchTransferFrom";
					readonly name: "permit";
					readonly type: "tuple";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "address";
							readonly name: "to";
							readonly type: "address";
						},
						{
							readonly internalType: "uint256";
							readonly name: "requestedAmount";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct ISignatureTransfer.SignatureTransferDetails[]";
					readonly name: "transferDetails";
					readonly type: "tuple[]";
				},
				{
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				},
				{
					readonly internalType: "bytes";
					readonly name: "signature";
					readonly type: "bytes";
				}
			];
			readonly name: "permitTransferFrom";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly components: readonly [
						{
							readonly components: readonly [
								{
									readonly internalType: "address";
									readonly name: "token";
									readonly type: "address";
								},
								{
									readonly internalType: "uint256";
									readonly name: "amount";
									readonly type: "uint256";
								}
							];
							readonly internalType: "struct ISignatureTransfer.TokenPermissions";
							readonly name: "permitted";
							readonly type: "tuple";
						},
						{
							readonly internalType: "uint256";
							readonly name: "nonce";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "deadline";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct ISignatureTransfer.PermitTransferFrom";
					readonly name: "permit";
					readonly type: "tuple";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "address";
							readonly name: "to";
							readonly type: "address";
						},
						{
							readonly internalType: "uint256";
							readonly name: "requestedAmount";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct ISignatureTransfer.SignatureTransferDetails";
					readonly name: "transferDetails";
					readonly type: "tuple";
				},
				{
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				},
				{
					readonly internalType: "bytes32";
					readonly name: "witness";
					readonly type: "bytes32";
				},
				{
					readonly internalType: "string";
					readonly name: "witnessTypeString";
					readonly type: "string";
				},
				{
					readonly internalType: "bytes";
					readonly name: "signature";
					readonly type: "bytes";
				}
			];
			readonly name: "permitWitnessTransferFrom";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly components: readonly [
						{
							readonly components: readonly [
								{
									readonly internalType: "address";
									readonly name: "token";
									readonly type: "address";
								},
								{
									readonly internalType: "uint256";
									readonly name: "amount";
									readonly type: "uint256";
								}
							];
							readonly internalType: "struct ISignatureTransfer.TokenPermissions[]";
							readonly name: "permitted";
							readonly type: "tuple[]";
						},
						{
							readonly internalType: "uint256";
							readonly name: "nonce";
							readonly type: "uint256";
						},
						{
							readonly internalType: "uint256";
							readonly name: "deadline";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct ISignatureTransfer.PermitBatchTransferFrom";
					readonly name: "permit";
					readonly type: "tuple";
				},
				{
					readonly components: readonly [
						{
							readonly internalType: "address";
							readonly name: "to";
							readonly type: "address";
						},
						{
							readonly internalType: "uint256";
							readonly name: "requestedAmount";
							readonly type: "uint256";
						}
					];
					readonly internalType: "struct ISignatureTransfer.SignatureTransferDetails[]";
					readonly name: "transferDetails";
					readonly type: "tuple[]";
				},
				{
					readonly internalType: "address";
					readonly name: "owner";
					readonly type: "address";
				},
				{
					readonly internalType: "bytes32";
					readonly name: "witness";
					readonly type: "bytes32";
				},
				{
					readonly internalType: "string";
					readonly name: "witnessTypeString";
					readonly type: "string";
				},
				{
					readonly internalType: "bytes";
					readonly name: "signature";
					readonly type: "bytes";
				}
			];
			readonly name: "permitWitnessTransferFrom";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly components: readonly [
						{
							readonly internalType: "address";
							readonly name: "from";
							readonly type: "address";
						},
						{
							readonly internalType: "address";
							readonly name: "to";
							readonly type: "address";
						},
						{
							readonly internalType: "uint160";
							readonly name: "amount";
							readonly type: "uint160";
						},
						{
							readonly internalType: "address";
							readonly name: "token";
							readonly type: "address";
						}
					];
					readonly internalType: "struct IAllowanceTransfer.AllowanceTransferDetails[]";
					readonly name: "transferDetails";
					readonly type: "tuple[]";
				}
			];
			readonly name: "transferFrom";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly inputs: readonly [
				{
					readonly internalType: "address";
					readonly name: "from";
					readonly type: "address";
				},
				{
					readonly internalType: "address";
					readonly name: "to";
					readonly type: "address";
				},
				{
					readonly internalType: "uint160";
					readonly name: "amount";
					readonly type: "uint160";
				},
				{
					readonly internalType: "address";
					readonly name: "token";
					readonly type: "address";
				}
			];
			readonly name: "transferFrom";
			readonly outputs: readonly [
			];
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		}
	];
	static createInterface(): Permit2Interface;
	static connect(address: string, runner?: ContractRunner | null): Permit2;
}
export declare class WETH__factory {
	static readonly abi: readonly [
		{
			readonly constant: true;
			readonly inputs: readonly [
			];
			readonly name: "name";
			readonly outputs: readonly [
				{
					readonly name: "";
					readonly type: "string";
				}
			];
			readonly payable: false;
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly constant: false;
			readonly inputs: readonly [
				{
					readonly name: "guy";
					readonly type: "address";
				},
				{
					readonly name: "wad";
					readonly type: "uint256";
				}
			];
			readonly name: "approve";
			readonly outputs: readonly [
				{
					readonly name: "";
					readonly type: "bool";
				}
			];
			readonly payable: false;
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly constant: true;
			readonly inputs: readonly [
			];
			readonly name: "totalSupply";
			readonly outputs: readonly [
				{
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly payable: false;
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly constant: false;
			readonly inputs: readonly [
				{
					readonly name: "src";
					readonly type: "address";
				},
				{
					readonly name: "dst";
					readonly type: "address";
				},
				{
					readonly name: "wad";
					readonly type: "uint256";
				}
			];
			readonly name: "transferFrom";
			readonly outputs: readonly [
				{
					readonly name: "";
					readonly type: "bool";
				}
			];
			readonly payable: false;
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly constant: false;
			readonly inputs: readonly [
				{
					readonly name: "wad";
					readonly type: "uint256";
				}
			];
			readonly name: "withdraw";
			readonly outputs: readonly [
			];
			readonly payable: false;
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly constant: true;
			readonly inputs: readonly [
			];
			readonly name: "decimals";
			readonly outputs: readonly [
				{
					readonly name: "";
					readonly type: "uint8";
				}
			];
			readonly payable: false;
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly constant: true;
			readonly inputs: readonly [
				{
					readonly name: "";
					readonly type: "address";
				}
			];
			readonly name: "balanceOf";
			readonly outputs: readonly [
				{
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly payable: false;
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly constant: true;
			readonly inputs: readonly [
			];
			readonly name: "symbol";
			readonly outputs: readonly [
				{
					readonly name: "";
					readonly type: "string";
				}
			];
			readonly payable: false;
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly constant: false;
			readonly inputs: readonly [
				{
					readonly name: "dst";
					readonly type: "address";
				},
				{
					readonly name: "wad";
					readonly type: "uint256";
				}
			];
			readonly name: "transfer";
			readonly outputs: readonly [
				{
					readonly name: "";
					readonly type: "bool";
				}
			];
			readonly payable: false;
			readonly stateMutability: "nonpayable";
			readonly type: "function";
		},
		{
			readonly constant: false;
			readonly inputs: readonly [
			];
			readonly name: "deposit";
			readonly outputs: readonly [
			];
			readonly payable: true;
			readonly stateMutability: "payable";
			readonly type: "function";
		},
		{
			readonly constant: true;
			readonly inputs: readonly [
				{
					readonly name: "";
					readonly type: "address";
				},
				{
					readonly name: "";
					readonly type: "address";
				}
			];
			readonly name: "allowance";
			readonly outputs: readonly [
				{
					readonly name: "";
					readonly type: "uint256";
				}
			];
			readonly payable: false;
			readonly stateMutability: "view";
			readonly type: "function";
		},
		{
			readonly payable: true;
			readonly stateMutability: "payable";
			readonly type: "fallback";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: true;
					readonly name: "src";
					readonly type: "address";
				},
				{
					readonly indexed: true;
					readonly name: "guy";
					readonly type: "address";
				},
				{
					readonly indexed: false;
					readonly name: "wad";
					readonly type: "uint256";
				}
			];
			readonly name: "Approval";
			readonly type: "event";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: true;
					readonly name: "src";
					readonly type: "address";
				},
				{
					readonly indexed: true;
					readonly name: "dst";
					readonly type: "address";
				},
				{
					readonly indexed: false;
					readonly name: "wad";
					readonly type: "uint256";
				}
			];
			readonly name: "Transfer";
			readonly type: "event";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: true;
					readonly name: "dst";
					readonly type: "address";
				},
				{
					readonly indexed: false;
					readonly name: "wad";
					readonly type: "uint256";
				}
			];
			readonly name: "Deposit";
			readonly type: "event";
		},
		{
			readonly anonymous: false;
			readonly inputs: readonly [
				{
					readonly indexed: true;
					readonly name: "src";
					readonly type: "address";
				},
				{
					readonly indexed: false;
					readonly name: "wad";
					readonly type: "uint256";
				}
			];
			readonly name: "Withdrawal";
			readonly type: "event";
		}
	];
	static createInterface(): WETHInterface;
	static connect(address: string, runner?: ContractRunner | null): WETH;
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
/**
 * Formats a raw trace response from debug_traceBlock/tx into structured CallTrace.
 * @param params Raw trace params.
 * @param txHash Transaction hash.
 * @param blockParams Block context (number, hash).
 * @returns Formatte CallTrace internal transaction object
 */
export declare function formatCallTrace(params: any, txHash: string, blockParams: BlockParams): CallTrace;
/**
 * Traces all transactions in a block for internal calls using debug_traceBlock...
 * @param provider JsonRpcProvider.
 * @param blockTag Block number/tag/hash (default: latest).
 * @param onlyTopCall If true, only include top-level calls.
 * @returns Array of call traces, one for each transaction.
 */
export declare function traceBlock(provider: JsonRpcProvider, blockTag?: BlockTag, onlyTopCall?: boolean): Promise<CallTrace[]>;
/**
 * Traces a single transaction's internal execution via debug_traceTransaction.
 * @param provider Provider instance.
 * @param hash Transaction hash to trace.
 * @param onlyTopCall If true, limit to top-level call.
 * @param txResp Optionally a preloaded transaction response.
 * @returns Structured CallTrace.
 */
export declare function traceTransaction(provider: JsonRpcProvider, hash: string, onlyTopCall?: boolean, txResp?: TransactionResponse): Promise<CallTrace>;
/**
 * Callback describing batch progress during requests.
 */
export type BatchOnProgress = (progress: {
	type: string;
	chunkIndex: number;
	chunkLength: number;
	chunks: any;
	chunksResult: any;
	resultLength: number;
}) => void;
/**
 * Options for configuring a generic batch request.
 */
export interface CreateBatchRequestParams {
	concurrencySize?: number;
	batchSize?: number;
	delays?: number;
	reverse?: boolean;
	retryMax?: number;
	retryOn?: number;
	onProgress?: BatchOnProgress;
}
/**
 * Runs batch requests concurrently and in chunks for rate-limited APIs.
 * Handles retry and calls outputFunc for each batch.
 * @param params Batch request options.
 * @param type Type name for logging/progress.
 * @param inputs Array of input values.
 * @param outputFunc The async function to call for each input.
 * @returns Array of output results.
 */
export declare function createBatchRequest<Input, Output>(params: CreateBatchRequestParams | undefined, type: string, inputs: Input[], outputFunc: (input: Input) => Promise<Output>): Promise<Output[]>;
export interface EthersBatcherParams extends CreateBatchRequestParams {
	ratePerSecond?: number;
	eventRange?: number;
}
/**
 * Helper class to fetch large amount of blocks / transactions / contract events
 * as quick as possible using batching and concurrent calls
 */
export declare class EthersBatcher {
	ratePerSecond: number;
	eventRange: number;
	concurrencySize: number;
	batchSize: number;
	delays: number;
	reverse: boolean;
	retryMax: number;
	retryOn: number;
	onProgress?: BatchOnProgress;
	/**
	 * Helper class to fetch large amounts of blocks, transactions, contract events,
	 * and storage using batching and concurrency.
	 * @param {EthersBatcherParams} [params] Object with the following optional properties:
	 *  - ratePerSecond {number}: Maximum requests per second (default 10)
	 *  - eventRange {number}: Default block range for event queries (default 5000)
	 *  - concurrencySize {number}: Number of concurrent batch workers (defaults based on ratePerSecond)
	 *  - batchSize {number}: Number of requests per sub-batch (defaults based on ratePerSecond)
	 *  - delays {number}: Delay interval between batches in ms (default: 1000)
	 *  - reverse {boolean}: If true, processes batches in reverse block order
	 *  - retryMax {number}: Number of retries for failed batches (default 2)
	 *  - retryOn {number}: Milliseconds to wait before retrying (default 500)
	 *  - onProgress {BatchOnProgress}: Optional progress callback
	 */
	constructor({ ratePerSecond, eventRange, concurrencySize, batchSize: maxBatch, delays: _delays, reverse, retryMax, retryOn, onProgress, }?: EthersBatcherParams);
	createBatchRequest<Input, Output>(type: string, inputs: Input[], outputFunc: (input: Input) => Promise<Output>): Promise<Output[]>;
	/**
	 * Batch function to fetch multiple blocks in parallel.
	 * @param provider RPC provider.
	 * @param blockTags List of block numbers or tags.
	 * @param prefetchTxs True to also fetch transactions.
	 * @returns Array of Block objects.
	 */
	getBlocks(provider: Provider, blockTags: BlockTag[], prefetchTxs?: boolean): Promise<Block[]>;
	/**
	 * Fetches transactions by their hashes in batches.
	 * @param provider Provider to use.
	 * @param txids Array of transaction hashes.
	 * @returns Array of TransactionResponse objects.
	 */
	getTransactions(provider: Provider, txids: string[]): Promise<TransactionResponse[]>;
	/**
	 * Fetches multiple transaction receipts concurrently.
	 * @param provider Provider to use.
	 * @param txids Array of transaction hashes.
	 * @returns Array of TransactionReceipt objects.
	 */
	getTransactionReceipts(provider: Provider, txids: string[]): Promise<TransactionReceipt[]>;
	/**
	 * Fetches receipts for all transactions in specified blocks.
	 * @param provider JsonRpcProvider instance.
	 * @param blockTags Block tags or numbers.
	 * @returns Array of receipts.
	 */
	getBlockReceipts(provider: JsonRpcProvider, blockTags: BlockTag[]): Promise<TransactionReceipt[]>;
	/**
	 * Returns internal call traces for all transactions in each block.
	 * @param provider Provider.
	 * @param blockTags Block tags or numbers.
	 * @param onlyTopCall If true, only fetch top-level calls.
	 * @returns All call traces in those blocks.
	 */
	traceBlock(provider: JsonRpcProvider, blockTags: BlockTag[], onlyTopCall?: boolean): Promise<CallTrace[]>;
	/**
	 * Returns internal call traces for specified transactions.
	 * @param provider Provider.
	 * @param txids Array of transaction hashes.
	 * @param onlyTopCall If true, only fetch top-level call.
	 * @returns CallTrace array for each transaction.
	 */
	traceTransaction(provider: JsonRpcProvider, txids: string[], onlyTopCall?: boolean): Promise<CallTrace[]>;
	/**
	 * Fetch batches of event logs for given range (and contract/event).
	 * @param args Query settings {address, provider, contract, event, fromBlock, toBlock}
	 * @returns Array of Log/EventLog.
	 */
	getEvents({ address, provider, contract, event, fromBlock, toBlock, }: {
		address?: string | string[];
		provider?: Provider;
		contract?: BaseContract;
		event?: ContractEventName;
		fromBlock?: number;
		toBlock?: number;
	}): Promise<(Log | EventLog)[]>;
	/**
	 * Fetches arbitrary contract storage slots at a target block.
	 * @param provider Provider.
	 * @param contractAddress Target contract address.
	 * @param storageKeys Keys to fetch.
	 * @param blockTag Block number or tag.
	 * @returns Array of string values.
	 */
	getStorageAt(provider: Provider, contractAddress: string, storageKeys: string[], blockTag?: BlockTag): Promise<string[]>;
	/**
	 * Finds a storage slot in the given range where the value is non-zero.
	 * @param provider Provider instance.
	 * @param contractAddress Target contract.
	 * @param storageKeyGetter Function mapping an index to a storage slot.
	 * @param blockTag Block context.
	 * @param fromIndex Inclusive start index.
	 * @param toIndex Inclusive end index.
	 * @returns First index/slot found (or undefined if not found).
	 */
	findStorageKey(provider: Provider, contractAddress: string, storageKeyGetter: (index: number) => string, blockTag?: BlockTag, fromIndex?: number, toIndex?: number): Promise<{
		storageSlot: number;
		storageKey: string;
	} | undefined>;
}
/**
 * Compare last 80 blocks to find reorgs
 */
export interface BlockHash {
	number: number;
	hash?: string;
}
/**
 * Fetches recent block hashes, using multicall when possible for efficiency.
 * @param provider The provider (optionally with multicall).
 * @param knownBlock Optional: block to start from (defaults to latest).
 * @param depth Optional: how many blocks to look back (default 80).
 * @returns Array of BlockHash {number, hash}.
 */
export declare function fetchBlockHashes(provider: Provider & {
	multicall?: Multicall;
}, knownBlock?: number, depth?: number): Promise<BlockHash[]>;
/**
 * Returns the first block number where the hashes from two sources disagree (detects reorgs).
 * @param fromLocal Locally cached block hashes.
 * @param fromNode Current chain block hashes.
 * @returns The reorged block number, or undefined if chains match.
 */
export declare function compareBlockHashes(fromLocal: BlockHash[], fromNode: BlockHash[]): number | undefined;
/**
 * Fetches all transaction receipts for a specific block.
 * @param provider The ethers Provider.
 * @param blockTag Block number, tag, or hash.
 * @param network Optional network override.
 * @returns Promise resolving to the array of TransactionReceipts for the block.
 */
export declare function getBlockReceipts(provider: Provider, blockTag?: BlockTag, network?: Network): Promise<TransactionReceipt[]>;
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
/**
 * Extension of ethers' FeeData for more granular priority fee tracking.
 */
export declare class FeeDataExt extends FeeData {
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
/**
 * Enhanced Ethers Provider with Multicall, static network detection, batch fee data, and ENS support.
 *
 * (Which comes with static network, multicaller enabled by defaut)
 * (Multicaller inspired by https://github.com/ethers-io/ext-provider-multicall)
 */
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
export declare const HARDHAT_CHAIN = 31337n;
export declare const ARB_CHAIN = 42161n;
export declare const ARB_GAS_LIMIT = 5000000n;
export declare const DEFAULT_GAS_LIMIT = 500000n;
export declare const DEFAULT_GAS_PRICE_BUMP = 2;
export declare const DEFAULT_GAS_LIMIT_BUMP = 1.3;
export declare const GAS_LIMIT_FAILOVER = 2000000n;
/**
 * Transaction options with possible additional L1 fee or total cost info.
 */
export interface TransactionRequestWithFees extends TransactionRequest {
	l1Fee?: bigint;
	txCost?: bigint;
}
/**
 * Transaction response with possible additional fee info.
 */
export interface TransactionResponseWithFees extends TransactionResponse {
	l1Fee?: bigint;
	txCost?: bigint;
}
/**
 * Fills in missing fields (gas, nonce, fees, value, etc.) for a transaction.
 * Also supports auto-calculation of max value for EOA or contract txs.
 * @param signer A ProxySigner instance.
 * @param tx A transaction request (possibly incomplete).
 * @returns Fully populated TransactionRequestWithFees.
 */
export declare function populateTransaction(signer: SignerWithAddress, tx?: TransactionRequestWithFees): Promise<TransactionRequestWithFees>;
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
/**
 * Proxies all Signer method calls to a parent Signer (Optionally binding to a "wrapped" provider).
 * Useful for auto-populating transactions, fast signer swapping, and enhanced test/dev experience.
 */
export declare class ProxySigner implements SignerWithAddress {
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
 * Options for adding or switching chains in a browser wallet.
 */
export interface AddEthereumChainParams {
	chainName?: string;
	chainSymbol?: string;
	rpcUrl?: string;
	explorerUrl?: string;
}
/**
 * Attempts to switch or add the given chain on the connected browser wallet.
 * @param chainId The target chain ID (bigint).
 * @param ethereum The browser EIP-1193 provider object.
 * @param params Optional parameters for chain addition.
 */
export declare function switchChain(chainId: bigint, ethereum: Eip1193Provider & {
	isTrust?: boolean;
}, params?: AddEthereumChainParams): Promise<void>;
/**
 * A callback type for browser events.
 */
export type browserCallBack = (...args: any[]) => void;
/**
 * Extended `BrowserProviderOptions` including chain metadata and callbacks.
 */
export interface BrowserProviderOptionsExt extends BrowserProviderOptions, AddEthereumChainParams, ProxySignerOptions {
	chainChanged?: browserCallBack;
	accountsChanged?: browserCallBack;
	disconnect?: browserCallBack;
}
/**
 * A BrowserProvider supporting EIP-1193, EIP-6963, and with handy event/callback integration.
 * Also supports injection of an 'appProvider' for extra context.
 */
export declare class BrowserProvider extends ethBrowserProvider {
	ethereum: Eip1193Provider & EventEmitter;
	appProvider?: JsonRpcProvider;
	options?: BrowserProviderOptionsExt;
	chainChanged?: browserCallBack;
	accountsChanged?: browserCallBack;
	disconnect?: browserCallBack;
	/**
	 * Create a new BrowserProvider instance.
	 * @param ethereum The injected EIP-1193 provider.
	 * @param appProvider Optional fallback/provider for network context.
	 * @param options Additional options.
	 */
	constructor(ethereum: Eip1193Provider & EventEmitter, appProvider?: JsonRpcProvider, options?: BrowserProviderOptionsExt);
	/**
	 * Returns a ProxySigner-wrapped JsonRpcSigner for the given address.
	 * Handles chain switching automatically if required.
	 * @param address Signer address to retrieve.
	 * @returns Promise resolving to JsonRpcSigner instance.
	 */
	getSigner(address: string): Promise<JsonRpcSigner>;
	/**
	 * Supports EIP-6963 discovery for browser wallet providers; returns matching BrowserProviders.
	 * https://github.com/ethers-io/ethers.js/commit/f5469dd0e0719389d51e0106ee36d07a7ebef875
	 * @param appProvider Optional backend provider.
	 * @param options Optional options.
	 * @returns Promise resolving to an array of detected BrowserProvider instances.
	 */
	static discoverProviders(appProvider?: JsonRpcProvider, options?: BrowserProviderOptionsExt): Promise<BrowserProvider[]>;
}
export declare function isDeferred(value: any): value is DeferredTopicFilter;
export declare function getSubInfo(_interface: Interface, event: ContractEventName): Promise<{
	fragment: null | EventFragment;
	tag: string;
	topics: TopicFilter;
}>;
/**
 * Queries for event logs (optionally decoded) from provider or contract, in an arbitrary block range.
 * Supports basic topic and address filtering. If `address === '*'` scans the entire blockchain.
 *
 * @param args
 *   - address: Address(es) to filter on (optional).
 *   - provider: Provider to use (optional).
 *   - contract: Contract instance for decoding (optional).
 *   - event: The event signature/name (optional).
 *   - fromBlock: Start of block range (default: 0).
 *   - toBlock: End of block range (default: 'latest').
 * @returns Array of EventLog, UndecodedEventLog, or Log objects.
 */
export declare function multiQueryFilter({ address, provider, contract, event, fromBlock, toBlock, }: {
	address?: string | string[];
	provider?: Provider;
	contract?: BaseContract;
	event?: ContractEventName;
	fromBlock?: BlockTag;
	toBlock?: BlockTag;
}): Promise<Log[]>;
/**
 * Response from eth_feeHistory.
 */
export interface FeeHistoryResp {
	oldestBlock?: string;
	baseFeePerGas?: string[];
	gasUsedRatio?: number[];
	reward?: string[][];
	baseFeePerBlobGas?: string[];
	blobGasUsedRatio?: number[];
}
/**
 * Details for a single block from fee history.
 */
export interface FeeHistoryBlock {
	number: number | string;
	gasUsedRatio: number;
	baseFeePerGas: bigint;
	priorityFeePerGas: bigint[];
}
/**
 * Format of fee history, aggregated for analysis.
 */
export interface FormattedFeeHistory {
	blocks: FeeHistoryBlock[];
	baseFeePerGasAvg: bigint;
	priorityFeePerGasAvg: bigint[];
}
/**
 * Formats the `eth_feeHistory` response into an array of historical fee blocks,
 * and computes averages.
 * @param result Original response.
 * @param historicalBlocks How many blocks to include.
 * @param includePending Whether or not to add a 'pending' pseudo-block.
 * @returns Parsed fee history object with average calculations.
 */
export declare function formatFeeHistory(result: FeeHistoryResp, historicalBlocks: number, includePending?: boolean): FormattedFeeHistory;
/**
 * Computes a suitable gas price from FeeData for EIP1559 or legacy transactions.
 * @param feeData FeeData object as returned by Provider.
 * @returns The appropriate gas price.
 */
export declare function getGasPrice(feeData: FeeData): bigint;
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
/**
 * Address of the OP Stack L1 Gas Price Oracle on standard OP chains.
 */
export declare const GAS_PRICE_ORACLE_ADDRESS = "0x420000000000000000000000000000000000000F";
/**
 * Calculate the L1 data/fee for an OP Stack transaction, using the onchain oracle contract.
 * @param oracle Instance of OpGasPriceOracle contract.
 * @param tx Optional: TransactionRequest to calculate the L1 fee for.
 * @returns Promise resolving to the L1 fee as a bigint.
 */
export declare function getL1Fee(oracle: OpGasPriceOracle, tx?: TransactionRequest): Promise<bigint>;
/**
 * Create an EIP-2612 permit signature for an ERC20 token from a signer.
 * @param erc20 ERC20 contract instance (with Permit support).
 * @param spender Address to approve allowance for (as string or BaseContract).
 * @param value Maximum token amount to approve (default: MaxUint256).
 * @param deadline Permit signature deadline (default: MaxUint256, i.e. infinite).
 * @returns Promise resolving to an ethers Signature instance.
 */
export declare function permit(erc20: unknown, spender: string | BaseContract, value?: bigint, deadline?: number | bigint): Promise<Signature>;
/**
 * Returns the OffchainOracle (1inch) contract address.
 */
export declare const OFFCHAIN_ORACLE_ADDRESS = "0x00000000000D6FFc74A8feb35aF5827bf57f6786";
/**
 * Calculates the token's price in wei as returned by the offchain oracle,
 * normalized to the token's decimals (not 1e18).
 * Use `formatEther(result)` to get human readable value.
 * @param oracle OffchainOracle contract instance.
 * @param erc20 ERC20 token contract instance.
 * @returns Promise resolving to token price in wei.
 */
export declare function getRateToEth(oracle: OffchainOracle, erc20: unknown): Promise<bigint>;
export declare const PHASE_OFFSET = 64;
/**
 * Returns the lower 64 bits (aggregator round id) of a Chainlink round id.
 * @param roundId The full roundId as BigInt.
 * @returns Aggregator round id as number.
 */
export declare function getAggregatorRoundId(roundId: bigint): number;
/**
 * Data format for a Chainlink price round.
 */
export interface RoundData {
	roundId: bigint;
	aggregatorRoundId?: number;
	answer: bigint;
	startedAt: number;
	updatedAt: number;
}
/**
 * Resolves the Chainlink DataFeed contract for a symbol or address, auto-mapping
 * the ENS address if a symbol is given (default quote: USD).
 * @param provider ethers Provider.
 * @param symbolOrAddress Token symbol (ETH, WBTC, SOL, etc) or contract address.
 * @param quoteSymbol Reference currency, default is 'usd'.
 * @returns Promise resolving to a DataFeed contract instance.
 * @throws Error if the provided symbol is not supported by Chainlink ENS.
 */
export declare function getChainlink(provider: Provider, symbolOrAddress: string, quoteSymbol?: string): Promise<DataFeed>;
/**
 * Fetches the latest price from a Chainlink DataFeed, formatted as a number in quote currency.
 * @param provider ethers Provider instance.
 * @param symbolOrAddress Token symbol or datafeed address.
 * @param quoteSymbol Quote currency symbol (e.g. 'usd', 'eth') (optional).
 * @returns Promise resolving to latest price as a number.
 */
export declare function getChainlinkPrice(provider: Provider, symbolOrAddress: string, quoteSymbol?: string): Promise<number>;
/**
 * Describes a single storage proof entry for EIP-1186.
 */
export interface StorageProof {
	key: string;
	value: string;
	proof: string[];
}
/**
 * EIP-1186 proof structure for account and storage.
 */
export interface EIP1186Proof {
	address?: string;
	accountProof: string[];
	balance: string;
	codeHash: string;
	nonce: string;
	storageRoot: string;
	storageHash: string;
	storageProof: StorageProof[];
}
/**
 * Fetches a merkle proof for a given contract and storage slot at a block.
 * @param provider The JSON-RPC API provider.
 * @param contractAddress The contract to prove.
 * @param storageKeys A single or array of storage slot keys.
 * @param blockTag Optional block number/tag.
 * @returns Promise resolving to the EIP-1186 proof.
 */
export declare function getProof(provider: Provider, contractAddress: string, storageKeys: string | string[], blockTag?: BlockTag): Promise<EIP1186Proof>;
/**
 * Fetches the value of a specific storage slot for a contract at a block.
 * @param provider The JSON-RPC provider.
 * @param contract The contract address.
 * @param storageKey Numeric or string slot.
 * @param blockTag Optional block tag.
 * @returns The value at that storage key (as a hex string).
 */
export declare function getStorageAt(provider: Provider, contract: string, storageKey: string | number, blockTag?: BlockTag): Promise<string>;
/**
 * Detects (heuristically) whether runtime is Node.js.
 * @returns {boolean} True if running in Node.js, false otherwise (browser).
 */
export declare const isNode: boolean;
/**
 * Computes optimal concurrency and batchSize for a given rate-per-second
 * limit and batch interval (delays), maximizing both under the constraint:
 *   concurrency * batchSize <= ratePerBatch
 *
 * We allow 0 delays to execute batches without delays but the batch size would remain the same
 *
 * @param {number} ratePerSecond - Maximum calls per second allowed.
 * @param {number} [maxBatch=5] - Maximum batch size.
 * @param {number} [delays=1000] - Fixed delay time for each batch (ms).
 * @returns {{ concurrency: number, batchSize: number, delays: number }} An object containing concurrency, batchSize, and delays.
 */
export declare function createBatchRateConfig(ratePerSecond: number, maxBatch?: number, delays?: number): {
	concurrency: number;
	batchSize: number;
	delays: number;
};
/**
 * Creates an array of block tag ranges for batching.
 * @param {number} fromBlock - First block.
 * @param {number} toBlock - Last block.
 * @param {number} [batchSize=1000] - Number of blocks per batch.
 * @param {boolean} [reverse=false] - If true, returns ranges in reverse order.
 * @returns {Array<{fromBlock: number, toBlock: number}>} Array of objects specifying the range for each batch.
 * @throws {Error} If the block range is invalid.
 */
export declare function createBlockTags(fromBlock: number, toBlock: number, batchSize?: number, reverse?: boolean): {
	fromBlock: number;
	toBlock: number;
}[];
/**
 * Generates a range of numbers (inclusive).
 * @param {number} start - First value.
 * @param {number} stop - Last value.
 * @param {number} [step=1] - Increment.
 * @returns {number[]} Array containing the generated range.
 */
export declare function range(start: number, stop: number, step?: number): number[];
/**
 * Splits an array into chunks of a given size.
 * @param {T[]} arr - Array to split.
 * @param {number} size - Maximum size of each chunk.
 * @returns {T[][]} An array of arrays, each with up to 'size' elements.
 * @template T
 */
export declare function chunk<T>(arr: T[], size: number): T[][];
/**
 * Returns a promise resolved after the specified duration.
 * @param {number} ms - Milliseconds to sleep.
 * @returns {Promise<void>} Promise that resolves after the delay.
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Node/browser-compatible cryptography interface.
 */
declare const crypto$1: webcrypto.Crypto;
/**
 * Performs a digest (SHA-256 or other) of a byte array.
 * @param {Uint8Array} bytes - Input bytes.
 * @param {string} [algorithm='SHA-256'] - Algorithm name.
 * @returns {Promise<Uint8Array>} Digest as a Uint8Array.
 */
export declare function digest(bytes: Uint8Array, algorithm?: string): Promise<Uint8Array>;
/**
 * Hashes a hex string to another hex string digest.
 * @param {string} hexStr - Input hex string.
 * @param {string} [algorithm='SHA-256'] - Algorithm to use.
 * @returns {Promise<string>} Hex string (with 0x) of the digest.
 */
export declare function digestHex(hexStr: string, algorithm?: string): Promise<string>;
/**
 * Generates a cryptographically random byte buffer.
 * @param {number} [length=32] - Number of bytes.
 * @returns {Uint8Array} Randomly generated bytes.
 */
export declare function rBytes(length?: number): Uint8Array;
/**
 * Converts Node.js Buffer to Uint8Array.
 * @param {Buffer} b - Node.js Buffer.
 * @returns {Uint8Array} Converted Uint8Array.
 */
export declare function bufferToBytes(b: Buffer): Uint8Array;
/**
 * Concatenates multiple Uint8Arrays into one.
 * @param {...Uint8Array[]} arrays - Arrays to concatenate.
 * @returns {Uint8Array} New concatenated Uint8Array.
 */
export declare function concatBytes(...arrays: Uint8Array[]): Uint8Array;
/**
 * Converts a 0x-prefixed hex string or bigint to a Uint8Array.
 * @param {bigint | string} input - The input hex string or bigint.
 * @returns {Uint8Array} The bytes.
 */
export declare function hexToBytes(input: bigint | string): Uint8Array;
/**
 * Converts a Uint8Array to a 0x-prefixed hex string.
 * @param {Uint8Array} bytes - Input bytes.
 * @returns {string} Hex string of the bytes, 0x-prefixed.
 */
export declare function bytesToHex(bytes: Uint8Array): string;
/**
 * Pads to even-length hex string and ensures 0x prefix.
 * @param {string} hexStr - Hex string with or without prefix.
 * @returns {string} 0x-prefixed, even-length hex string.
 */
export declare function toEvenHex(hexStr: string): string;
/**
 * Converts a bigint/number/string into a 0x-prefixed, fixed-length-zero-padded hex string.
 * @param {bigint | number | string} numberish - The number, bigint, or numeric string.
 * @param {number} [length=32] - Number of bytes in output.
 * @returns {string} Fixed-length, 0x-prefixed hex string.
 */
export declare function toFixedHex(numberish: bigint | number | string, length?: number): string;
/**
 * Base64
 */
/**
 * Converts a base64 string to a Uint8Array.
 * @param {string} base64 - Input base64 string.
 * @returns {Uint8Array} Decoded bytes as a Uint8Array.
 */
export declare function base64ToBytes(base64: string): Uint8Array;
/**
 * Converts bytes to a base64 string.
 * @param {Uint8Array} bytes - Bytes to encode.
 * @returns {string} Base64-encoded string.
 */
export declare function bytesToBase64(bytes: Uint8Array): string;
/**
 * Converts a base64-encoded string to a 0x-prefixed hex string.
 * @param {string} base64 - Base64 string.
 * @returns {string} Hex string representation.
 */
export declare function base64ToHex(base64: string): string;
/**
 * Converts a 0x-prefixed hex string to a base64 string.
 * @param {string} hex - Input hex string, prefixed or not.
 * @returns {string} Base64-encoded version.
 */
export declare function hexToBase64(hex: string): string;
/**
 * Returns true if the string is a valid 0x-prefixed hex representation.
 * @param {string} value - String to check.
 * @returns {boolean} True if valid hex, false otherwise.
 */
export declare function isHex(value: string): boolean;

declare namespace factories {
	export { CreateX__factory, DataFeed__factory, ERC20__factory, Multicall__factory, OffchainOracle__factory, OpGasPriceOracle__factory, Permit2__factory, WETH__factory };
}

export {
	Provider$1 as Provider,
	crypto$1 as crypto,
	factories,
};

export {};
