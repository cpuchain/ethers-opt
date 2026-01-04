# Hardhat Tasks

Current directory contains multiple hardhat tasks that could be used to fix or expand hardhat tasks

```ts
import 'hardhat-preprocessor';
import 'ethers-opt/hardhat/flatten';
import 'ethers-opt/hardhat/typefix';
import { getRemappingsTransformerFunc } from 'ethers-opt/hardhat/remappings';
```

### Fixtures

Can use wrapped `getSigners()` function to wrap default Ethers.js Signer to Ethers-Opt ProxySigner to improve tx fee calculations, batched multicalls, etc.

```ts
import { getSigners } from 'ethers-opt/hardhat/fixtures';

async function test() {
    const [owner] = await getSigners();

    console.log(await owner.sendTransaction({ to: owner.address, value: 0n }));
}
```