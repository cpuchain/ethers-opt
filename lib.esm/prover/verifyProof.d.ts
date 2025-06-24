import { EIP1186Proof } from '../proof';
import { SignerWithAddress } from '../signer';
import { RoundData } from '../price';
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
