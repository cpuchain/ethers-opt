import { defineConfig } from 'vitest/config'

export default defineConfig({
    test: {
        watch: false,
        //fileParallelism: false,
        testTimeout: 50000,
        include: ['test/**/*.ts'],
        coverage: {
            enabled: true,
            include: [
                "src/**/*.ts",
            ],
            exclude: [
                "src/hardhat/**/*.ts",
                "src/typechain/**/*.ts",
                "src/typechain-hardhat/**/*.ts",
                "src/browserProvider.ts",
                "src/ethers.ts",
                "src/getUrl.ts",
                "src/idb.ts",
                "src/index.umd.ts",
                "src/traceBlock.ts",
                "src/ens/*.ts"
            ],
            reporter: [
                "text",
                "json-summary",
                "html"
            ],
            reportsDirectory: './coverage',
        },
    },
});