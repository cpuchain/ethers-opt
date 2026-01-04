import { stat, readFile } from 'fs/promises';

async function existsAsync(fileOrDir) {
  try {
    await stat(fileOrDir);
    return true;
  } catch {
    return false;
  }
}

async function getRemappings() {
  if (!await existsAsync("remappings.txt")) {
    return;
  }
  return (await readFile("remappings.txt", { encoding: "utf8" })).split("\n").filter(Boolean).map((l) => l.trim().split("="));
}
async function getRemappingsTransformerFunc() {
  const remappings = await getRemappings();
  const transform = (line) => {
    if (remappings && line.match(/^\s*import /i)) {
      remappings.forEach(([find, replace]) => {
        if (line.includes(find)) {
          line = line.replace(find, replace);
        }
      });
    }
    return line;
  };
  return { transform };
}

export { getRemappings, getRemappingsTransformerFunc };
