# Ethers-Opt Examples

This page demonstrates class methods that would override [ethers.js](https://ethers.org) class objects.

For existing ethers.js class objects refer [ethers.js V6 documentation](https://docs.ethers.org/v6/) for more info.

::: warning
Following examples does not document every available features / functions from Ethers-Opt. I would recommend referring [test cases](https://github.com/cpuchain/ethers-opt/tree/main/test) and [source code](https://github.com/cpuchain/ethers-opt/tree/main/src) to find available codes.
:::

::: warning
Any Ethers-Opt code are subject to change especially when API changes on the upstream ethers.js code. So please follow changes on their repository as well if you seek to use this library.
:::

## Table of Contents

- [Fixtures](#fixtures)
- [Prover](#prover)
- [Batcher](#batcher)
- [Block Hashes](#block-hashes)
- [Block Receipts](#block-receipts)
- [Browser Provider](#browser-provider)
- [Events](#events)
- [Fee Estimator](#fee-estimator)
- [Multicall](#multicall)
- [OP Stack (Optimism)](#op-stack-optimism)
- [Permit](#permit)
- [Proof](#proof)
- [Provider](#provider)
- [Signer](#signer)
- [Trace Block](#trace-block)
- [Utils](#utils)
- [Price](#price)
- [ENS](#ens)

---

## Fixtures

```ts
import { getSigners, deployERC20 } from 'ethers-opt/fixtures';

// Get signers wrapped for test/development
const [owner, bob] = await getSigners();

// Deploy a test ERC20 token
const token = await deployERC20(owner, "MyToken", "MTK", 18, 1000000);

console.log(await token.symbol()); // "MTK"
```

---

## Prover

```ts
import { ERC20__factory, Provider } from 'ethers-opt';
import { verifyERC20Proof, verifyChainlinkProof } from 'ethers-opt/prover';

const provider = new Provider('https://1rpc.io/eth');
const usdt = ERC20__factory.connect('0xdAC17F958D2ee523a2206206994597C13D831ec7', provider);

const vitalik = await provider.resolveName('vitalik.eth');
const vitalikBalance = await usdt.balanceOf(vitalik);

// To verify ERC20 balance proof (needs correct balance slot index, here we try 0):
const proofResult = await verifyERC20Proof(usdt, 0, vitalik, vitalikBalance);
console.log(proofResult?.tokenBalance);
```

---

## Batcher

```ts
import { EthersBatcher } from 'ethers-opt';

const batcher = new EthersBatcher({ ratePerSecond: 10, batchSize: 2 });
const provider = /* your Provider */;
const blockNumbers = [10000000, 10000001];
const blocks = await batcher.getBlocks(provider, blockNumbers);
console.log(blocks.map(b => b.number));
```

---

## Block Hashes

```ts
import { fetchBlockHashes, compareBlockHashes, Provider } from 'ethers-opt';

const provider = new Provider('https://rpc.mevblocker.io');

// Fetch recent 10 block hashes
const hashes = await fetchBlockHashes(provider, undefined, 10);
console.log(hashes);

// Reorg detection
const a = [{ number: 1, hash: '0x1' }, { number: 2, hash: '0x2' }];
const b = [{ number: 1, hash: '0x1' }, { number: 2, hash: '0x3' }];
console.log(compareBlockHashes(a, b)); // 2
```

---

## Block Receipts

```ts
import { getBlockReceipts } from 'ethers-opt';

// Get all receipts for block 10000000
const provider = /* your Provider */;
const receipts = await getBlockReceipts(provider, 10000000);
console.log(receipts.length);
```

---

## Browser Provider

```ts
import { BrowserProvider } from 'ethers-opt';
// In browser context:
const [browserProvider] = await BrowserProvider.discoverProviders();
const signer = await browserProvider.getSigner('your-address');
console.log(await signer.getAddress());
```

---

## Events

```ts
import { multiQueryFilter } from 'ethers-opt';

// Get all Transfer events for a contract
const events = await multiQueryFilter({
  contract: myErc20Instance,
  event: 'Transfer'
});

console.log(events.map(e => e.blockNumber));
```

---

## Fee Estimator

```ts
import { formatFeeHistory, getGasPrice } from 'ethers-opt';

const feeHistoryRaw = await provider.send('eth_feeHistory', [10, "latest", [10, 25]]);
const formatted = formatFeeHistory(feeHistoryRaw, 10);
console.log(formatted.baseFeePerGasAvg);

// Extract gas price from fee data
const feeData = await provider.getFeeData();
const gasPrice = getGasPrice(feeData);
console.log(gasPrice);
```

---

## Multicall

```ts
import { multicall, Provider } from 'ethers-opt';

const provider = new Provider('...');
const multicallContract = provider.multicall;
const results = await multicall(multicallContract, [
  { contract: myErc20Instance, name: 'symbol' },
  { contract: myErc20Instance, name: 'decimals' },
  { contract: myErc20Instance, name: 'totalSupply' }
]);

console.log(results); // [ 'TST', 18n, 1000000n ]
```

---

## OP Stack (Optimism)

```ts
import { getL1Fee, OpGasPriceOracle__factory } from 'ethers-opt';

const opOracle = OpGasPriceOracle__factory.connect(
  "0x420000000000000000000000000000000000000F",
  provider
);

const l1Fee = await getL1Fee(opOracle, {
  to: '0x...',
  data: '0x'
});
console.log(l1Fee);
```

---

## Permit

```ts
import { permit } from 'ethers-opt';

const sig = await permit(tokenContract, spenderAddress, 123n, Date.now() + 3600);
// Use as input to token.permit function on-chain
console.log(sig);
```

---

## Proof

```ts
import { getProof, getStorageAt } from 'ethers-opt';

const proof = await getProof(provider, tokenAddress, [storageSlot], blockNumber);
console.log(proof);

const storageValue = await getStorageAt(provider, tokenAddress, storageSlot, blockNumber);
console.log(storageValue);
```

---

## Provider

```ts
import { Provider } from 'ethers-opt';

// Static network + Multicall out of the box
const provider = new Provider('https://rpc.mevblocker.io', undefined, { chainId: 1 });

const feeData = await provider.getFeeData();
console.log(feeData);

const receipts = await provider.getBlockReceipts();
console.log(receipts);
```

---

## Signer

```ts
import { ProxySigner } from 'ethers-opt';

// From mnemonic (dev setup)
const signer = ProxySigner.fromMnemonic(
  'test test test test test test test test test test test junk',
  provider
);
console.log(await signer.getAddress());

// Populate max value tx
const balance = await provider.getBalance(signer.address);
const tx = await signer.populateTransaction({ to: '0x...', value: balance });
console.log(tx);
```

---

## Trace Block

```ts
import { traceBlock, traceTransaction, Provider } from 'ethers-opt';

const provider = new Provider('https://rpc.mevblocker.io');
const traces = await traceBlock(provider, 10000000);
console.log(traces);

const callTrace = await traceTransaction(provider, '0xTxHash...');
console.log(callTrace);
```

---

## Utils

```ts
import { sleep, digest, rBytes, hexToBytes, bytesToHex, createBatchRateConfig } from 'ethers-opt';

await sleep(100); // Wait 100ms

const hash = await digest(new Uint8Array([1,2,3]));
console.log(bytesToHex(hash));

const rand = rBytes(16);
console.log(rand);

console.log(createBatchRateConfig(1000, 10, 0)); // { concurrency: 100, batchSize: 10, delays: 0 }
```

---

## Price

```ts
import { getRateToEth, getChainlinkPrice, Provider } from 'ethers-opt';

const provider = new Provider('https://rpc.mevblocker.io');
// 1inch offchain - ERC20 price to ETH (in wei)
const priceToEth = await getRateToEth(oracle, usdtInstance);
console.log(priceToEth);

// Chainlink price in USD as float
const ethUsd = await getChainlinkPrice(provider, "ETH");
console.log(ethUsd);
```

---

## ENS

```ts
import { Provider, EnsResolver } from 'ethers-opt';

const provider = new Provider('https://rpc.mevblocker.io');
const ensResolver = await EnsResolver.fromName(provider, 'vitalik.eth');
console.log(await ensResolver.getAddress());

const ensAddr = await provider.lookupAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045');
console.log(ensAddr); // "vitalik.eth" (if reverse record set)
```