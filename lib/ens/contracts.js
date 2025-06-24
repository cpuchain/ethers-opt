"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.wildcardResolvers = exports.ensReverseNode = exports.ensStaticResolvers = exports.ensUniversalResolvers = exports.ensRegistries = exports.chainNames = void 0;
exports.chainNames = {};
exports.ensRegistries = {
    // ETH ENS (mainnet, sepolia)
    1: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    11155111: '0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e',
    // Basenames
    8453: '0xB94704422c2a1E396835A571837Aa5AE53285a95',
    84532: '0x1493b2567056c2181630115660963E13A8E32735',
};
// Only supported by ETH ENS atm
exports.ensUniversalResolvers = {
    // ETH ENS (mainnet, sepolia)
    1: '0xce01f8eee7E479C928F8919abD53E553a36CeF67',
    11155111: '0xce01f8eee7E479C928F8919abD53E553a36CeF67',
};
exports.ensStaticResolvers = {
    // Using universal resolvers because they are also capable of querying custom resolves on behalf
    // (so that you don't need to know the exact resolver it works like a router contract)
    ...exports.ensUniversalResolvers,
    // Known main resolver for ENS like registries where universal resolver isn't available
    // Basenames
    8453: '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD',
    84532: '0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA',
};
// Some NS like Basenames uses custom node other than .addr.reverse, so we override them here
exports.ensReverseNode = {
    // BASE_REVERSE_NODE
    8453: '.80002105.reverse',
    84532: '.80002105.reverse',
};
// Known resolvers that supports ERC-2544 (aka ExtendedResolver resolve(bytes memory name, bytes memory data))
exports.wildcardResolvers = new Set([
    // ETH ENS (mainnet, sepolia)
    '0xce01f8eee7E479C928F8919abD53E553a36CeF67',
    // Basenames
    '0xC6d566A56A1aFf6508b41f6c90ff131615583BCD',
    '0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA',
]);
