import { AbstractProvider, BaseContract, BigNumberish, BytesLike, ContractMethod, ContractRunner, ContractTransaction, ContractTransactionResponse, DeferredTopicFilter, EnsResolver as ethEnsResolver, EventFragment, EventLog, FunctionFragment, Interface, JsonRpcApiProviderOptions, Listener, Provider, Provider as ethProvider, Result, Signer, TransactionRequest, Typed } from 'ethers';
import { Dispatcher, RequestInit as RequestInit$1 } from 'undici-types';

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
export interface fetchOptions extends Omit<RequestInit$1, "headers"> {
	headers?: any;
	timeout?: number;
	dispatcher?: Dispatcher;
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
 * Verifies the storage proof for a given contract's storage at a state root.
 * @param contractAddress Address of the contract to verify.
 * @param storageKey Storage slot to verify (hex string).
 * @param stateRoot The block state root.
 * @param proof The EIP-1186 proof object.
 * @returns Promise resolving to the storage root as a hex string on success, or throws on failure.
 */
export declare function verifyStorageProof(contractAddress: string, storageKey: string, stateRoot: string, proof: EIP1186Proof): Promise<string | undefined>;
/**
 * Included: Info about an individual storage/account proof.
 */
export interface ProofData {
	number: number;
	hash: string;
	stateRoot: string;
	storageKey: string;
	storageRoot: string;
	proof: EIP1186Proof;
}
/**
 * Verifies an ERC20 token balance proof at a specific block number.
 * @param erc20 ERC20 contract instance.
 * @param tokenBalanceSlot Storage slot for the token balance mapping.
 * @param owner Owner address or signer (whose balance is to be verified).
 * @param balance Optional expected balance (will auto-fetch if not given).
 * @param blockNumber Block number to verify at (current block if not specified).
 * @returns Resolves to proof data including tokenBalance, or throws if invalid.
 */
export declare function verifyERC20Proof(erc20: unknown, tokenBalanceSlot: number | string, owner?: SignerWithAddress | string, balance?: bigint, blockNumber?: number): Promise<(ProofData & {
	tokenBalance: bigint;
}) | undefined>;
/**
 * Verifies proof for a Chainlink price feed (round data) at a given block.
 * @param _oracle DataFeed oracle contract instance.
 * @param oracleSlot Proof slot index for Chainlink transmission mapping.
 * @param aggregator (Optional) Oracle aggregator address.
 * @param expectedAnswers (Optional) Expected round data to check.
 * @param blockNumber (Optional) Block number to verify.
 * @returns Resolves to proof data and round info, or throws if invalid.
 */
export declare function verifyChainlinkProof(_oracle: unknown, oracleSlot: number | string, aggregator?: string, expectedAnswers?: RoundData, blockNumber?: number): Promise<(ProofData & {
	aggregator: string;
	roundData: RoundData;
}) | undefined>;

export {};
