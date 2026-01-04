/**
 * Represents a deployment artifact (commonly for contract deployments).
 *
 * Inspired by @safe-global/safe-singleton-factory/artifacts/${chainId}/deployment.json
 */
export interface Deployment {
    gasPrice: number;
    gasLimit: number;
    signerAddress: string;
    transaction: string;
    address: string;
}
