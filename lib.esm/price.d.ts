import type { Provider } from 'ethers';
import { type OffchainOracle, DataFeed } from './typechain';
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
