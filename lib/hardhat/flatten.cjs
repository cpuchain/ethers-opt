'use strict';

var path = require('path');
var promises = require('fs/promises');
var glob = require('glob');
var config_js = require('hardhat/config.js');

async function checkAccess(dir) {
  try {
    await promises.access(dir, promises.constants.W_OK);
    return true;
  } catch {
    return false;
  }
}

config_js.task("flatten:all", "Flatten all contracts under flatten directory").addParam("input", "Contract src (default to contracts)", "./contracts").addParam("output", "Directory to save flatten contracts (default to flatten)", "./flatten").setAction(async (taskArgs, hre) => {
  const { input, output } = taskArgs;
  const files = await glob.glob(`${input}/**/*.sol`, { ignore: "node_modules/**" });
  await promises.rm(output, { recursive: true, force: true });
  for (const file of files) {
    const { dir, base } = path.parse(file);
    const destDir = dir.replace(path.parse(input).base, path.parse(output).base);
    const dest = path.join(destDir, base);
    if (!await checkAccess(destDir)) {
      await promises.mkdir(destDir, { recursive: true });
    }
    try {
      const flatten = await hre.run("flatten:get-flattened-sources", { files: [file] });
      await promises.writeFile(dest, flatten);
      console.log(`flatten:all: ${dest}`);
    } catch (e) {
      console.log(`flatten:all: error for ${dest} (likely circular)`);
      console.log(e);
    }
  }
});
