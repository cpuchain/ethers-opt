import path from 'path';
import { access, constants, rm, mkdir, writeFile } from 'fs/promises';
import { glob } from 'glob';
import { task } from 'hardhat/config.js';

async function checkAccess(dir) {
  try {
    await access(dir, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

task("flatten:all", "Flatten all contracts under flatten directory").addParam("input", "Contract src (default to contracts)", "./contracts").addParam("output", "Directory to save flatten contracts (default to flatten)", "./flatten").setAction(async (taskArgs, hre) => {
  const { input, output } = taskArgs;
  const files = await glob(`${input}/**/*.sol`, { ignore: "node_modules/**" });
  await rm(output, { recursive: true, force: true });
  for (const file of files) {
    const { dir, base } = path.parse(file);
    const destDir = dir.replace(path.parse(input).base, path.parse(output).base);
    const dest = path.join(destDir, base);
    if (!await checkAccess(destDir)) {
      await mkdir(destDir, { recursive: true });
    }
    try {
      const flatten = await hre.run("flatten:get-flattened-sources", { files: [file] });
      await writeFile(dest, flatten);
      console.log(`flatten:all: ${dest}`);
    } catch (e) {
      console.log(`flatten:all: error for ${dest} (likely circular)`);
      console.log(e);
    }
  }
});
