import { writeFile } from 'fs/promises';
import { Logger } from 'logger-chain';
import { EventLog } from 'ethers';
import { EthersBatcher, Provider } from '../src/index.js';
import { ERC20__factory } from '../src/typechain-hardhat/index.js';

const RPS = 15;
const EVENT_RANGE = 10000;

const RPC_URL = 'https://ethereum.keydonix.com/v1/mainnet';
// 0xBTC
const ERC20_ADDR = '0xB6eD7644C69416d67B522e20bC294A9a9B405B31';
const EVENT_FILE = './events.json';

async function syncEvents() {
    const provider = new Provider(RPC_URL);

    const token = ERC20__factory.connect(ERC20_ADDR, provider);

    const logger = new Logger();

    const batcher = new EthersBatcher({
        ratePerSecond: RPS,
        //batchSize: 10,
        eventRange: EVENT_RANGE,
        reverse: true, // to speed up
        onProgress: ({ type, chunkIndex, chunkLength, chunks, resultLength }) => {
            const progress = ((chunkIndex / chunkLength) * 100).toFixed(3);
            const fromBlock = (chunks[0].fromBlock || chunks[0]) as number;
            const toBlock = (chunks[chunks.length - 1].toBlock || chunks[chunks.length - 1]) as number;

            logger.debug(
                type,
                `Progress: ${progress}%, Index: ${chunkIndex}, Total: ${chunkLength}, From: ${fromBlock}, To: ${toBlock}, Results: ${resultLength}`,
            );
        },
    });

    const { ratePerSecond, eventRange, concurrencySize, batchSize, delays, retryMax } = batcher;

    logger.info(
        'Batcher',
        `${ratePerSecond} reqs/s, ${eventRange} blks, ${concurrencySize} con, ${batchSize} batch, ${delays / 1000} s, ${Boolean(retryMax)} retry`,
    );

    const [symbol, toBlock] = await Promise.all([token.symbol(), provider.getBlockNumber()]);

    const fromBlock = toBlock - 3_000_000;

    logger.info('Events', `Syncing ${symbol} token events from ${fromBlock} to ${toBlock}`);

    const events = ((await batcher.getEvents({ contract: token, fromBlock, toBlock })) as EventLog[]).map(
        ({
            address,
            blockNumber,
            blockHash,
            index: logIndex,
            transactionHash,
            transactionIndex,
            eventName: event,
            data,
            topics,
        }) => {
            return {
                blockNumber,
                blockHash,
                logIndex,
                address,
                transactionHash,
                transactionIndex,
                event,
                data,
                topics,
            };
        },
    );

    logger.info('Events', `Synced ${events.length} ${symbol} token events`);

    const blockHashes = [...new Set(events.map((e) => e.blockHash))];

    logger.info('Blocks', `Syncing ${blockHashes.length} blocks`);

    const blockTimestamps = (await batcher.getBlocks(provider, blockHashes)).reduce(
        (acc, { hash, timestamp }) => {
            acc[hash as string] = timestamp;
            return acc;
        },
        {} as Record<string, number>,
    );

    logger.info('Blocks', `Synced ${blockHashes.length} blocks`);

    events.forEach((event) => {
        (event as { timestamp?: number }).timestamp = blockTimestamps[event.blockHash];
    });

    await writeFile(EVENT_FILE, JSON.stringify(events, null, 2));
}
syncEvents();
