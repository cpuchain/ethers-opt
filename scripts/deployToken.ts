import { parseUnits } from 'ethers';
import { getSigners } from '../src/hardhat/fixtures/index.js';
import { ERC20Mock__factory } from '../src/typechain-hardhat/index.js';

const TOKEN_NAME = process.env.TOKEN_NAME || 'Test Token';
const TOKEN_SYMBOL = process.env.TOKEN_SYMBOL || 'TST';
const TOKEN_DECIMALS = Number(process.env.TOKEN_DECIMALS || 18);
const TOKEN_SUPPLY = Number(process.env.TOKEN_SUPPLY || '10000000');

async function deployToken() {
    const [owner] = await getSigners();

    const token = await new ERC20Mock__factory(owner).deploy(
        TOKEN_NAME,
        TOKEN_SYMBOL,
        TOKEN_DECIMALS,
        parseUnits(String(TOKEN_SUPPLY), TOKEN_DECIMALS),
    );

    const resp = await token.waitForDeployment();

    console.log(
        `Deployed ERC20 with ${TOKEN_SUPPLY} ${TOKEN_SYMBOL} (tx: ${resp.deploymentTransaction()?.hash})`,
    );
}

deployToken();
