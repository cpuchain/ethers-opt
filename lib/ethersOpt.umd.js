(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('ethers'), require('crypto')) :
    typeof define === 'function' && define.amd ? define(['exports', 'ethers', 'crypto'], factory) :
    (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.ethersOpt = {}, global.ethers));
})(this, (function (exports, ethers) { 'use strict';

    const chainNames = {};
    const ensRegistries = {
      // ETH ENS (mainnet, sepolia)
      1: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
      11155111: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e",
      // Basenames
      8453: "0xB94704422c2a1E396835A571837Aa5AE53285a95",
      84532: "0x1493b2567056c2181630115660963E13A8E32735"
    };
    const ensUniversalResolvers = {
      // ETH ENS (mainnet, sepolia)
      1: "0xce01f8eee7E479C928F8919abD53E553a36CeF67",
      11155111: "0xce01f8eee7E479C928F8919abD53E553a36CeF67"
    };
    const ensStaticResolvers = {
      // Using universal resolvers because they are also capable of querying custom resolves on behalf
      // (so that you don't need to know the exact resolver it works like a router contract)
      ...ensUniversalResolvers,
      // Known main resolver for ENS like registries where universal resolver isn't available
      // Basenames
      8453: "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD",
      84532: "0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA"
    };
    const ensReverseNode = {
      // BASE_REVERSE_NODE
      8453: ".80002105.reverse",
      84532: ".80002105.reverse"
    };
    const wildcardResolvers = /* @__PURE__ */ new Set([
      // ETH ENS (mainnet, sepolia)
      "0xce01f8eee7E479C928F8919abD53E553a36CeF67",
      // Basenames
      "0xC6d566A56A1aFf6508b41f6c90ff131615583BCD",
      "0x6533C94869D28fAA8dF77cc63f9e2b2D6Cf77eBA"
    ]);

    class EnsResolver extends ethers.EnsResolver {
      /**
       * Overrides method to support both ENS & Basename
       */
      async supportsWildcard() {
        if (wildcardResolvers.has(this.address)) {
          return true;
        }
        return super.supportsWildcard();
      }
      static async getEnsAddress(provider) {
        const network = await provider.getNetwork();
        const chainId = Number(network.chainId);
        const ensPlugin = network.getPlugin("org.ethers.plugins.network.Ens");
        const ensRegistryAddress = ensRegistries[chainId] || ensPlugin?.address;
        if (!ensRegistryAddress) {
          throw new Error(`Network ${chainId} doesn't have ENS registry address specified`);
        }
        return ensRegistryAddress;
      }
      static async #getResolver(provider, name, hash) {
        const chainId = Number((await provider.getNetwork()).chainId);
        if (ensStaticResolvers[chainId]) {
          return ensStaticResolvers[chainId];
        }
        const ensAddr = await EnsResolver.getEnsAddress(provider);
        try {
          const contract = new ethers.Contract(
            ensAddr,
            ["function resolver(bytes32) view returns (address)"],
            provider
          );
          const addr = await contract.resolver(hash || ethers.namehash(name || ""), {
            enableCcipRead: true
          });
          if (addr === ethers.ZeroAddress) {
            return null;
          }
          return addr;
        } catch (error) {
          throw error;
        }
      }
      // Override method to fetch resolver from non private method
      static async fromName(provider, name) {
        let currentName = name;
        while (true) {
          if (currentName === "" || currentName === ".") {
            return null;
          }
          if (name !== "eth" && currentName === "eth") {
            return null;
          }
          const addr = await EnsResolver.#getResolver(provider, currentName);
          if (addr != null) {
            const resolver = new EnsResolver(provider, addr, name);
            if (currentName !== name && !await resolver.supportsWildcard()) {
              return null;
            }
            return resolver;
          }
          currentName = currentName.split(".").slice(1).join(".");
        }
      }
      // Reverse name lookup ported from AbstractProvider
      static async lookupAddress(provider, address, reverseCheck = true) {
        try {
          address = ethers.getAddress(address);
          const chainId = Number((await provider.getNetwork()).chainId);
          const reverseName = address.substring(2).toLowerCase() + (ensReverseNode[chainId] || ".addr.reverse");
          const node = ethers.namehash(reverseName);
          const resolverAddress = await EnsResolver.#getResolver(provider, "", node);
          if (resolverAddress == null || resolverAddress === ethers.ZeroAddress) {
            return null;
          }
          const resolverContract = new ethers.Contract(
            resolverAddress,
            [
              "function reverse(bytes) view returns (string memory, address, address, address)",
              "function name(bytes32) view returns (string)"
            ],
            provider
          );
          if (ensUniversalResolvers[chainId]) {
            const dnsNode = ethers.dnsEncode(reverseName);
            const [name2, nameAddress] = await resolverContract.reverse(dnsNode);
            if (!name2 || nameAddress !== address) {
              return null;
            }
            return name2;
          }
          const name = await resolverContract.name(node);
          if (!name) {
            return null;
          }
          if (reverseCheck) {
            const nameAddress = await provider.resolveName(name);
            if (nameAddress !== address) {
              return null;
            }
          }
          return name;
        } catch (error) {
          if (ethers.isError(error, "BAD_DATA") && error.value === "0x") {
            return null;
          }
          if (ethers.isError(error, "CALL_EXCEPTION")) {
            return null;
          }
          throw error;
        }
      }
      /**
       * Method overrides to handle errors if name doesn't exist
       * (Error: could not decode result data ethers/src.ts/providers/ens-resolver.ts:249:30)
       * (Cannot be handled by checking if resolver address is null or result is '0x')
       * (Likely bug on #fetch from EnsResolver with return iface.decodeFunctionResult(fragment, result)[0];)
       */
      async getAddress(coinType) {
        try {
          return await super.getAddress(coinType);
        } catch (error) {
          if (ethers.isError(error, "BAD_DATA") && error.value === "0x") {
            return null;
          }
          throw error;
        }
      }
      async getText(key) {
        try {
          return await super.getText(key);
        } catch (error) {
          if (ethers.isError(error, "BAD_DATA") && error.value === "0x") {
            return null;
          }
          throw error;
        }
      }
      async getContentHash() {
        try {
          return await super.getContentHash();
        } catch (error) {
          if (ethers.isError(error, "BAD_DATA") && error.value === "0x") {
            return null;
          }
          throw error;
        }
      }
      async getAvatar() {
        try {
          return await super.getAvatar();
        } catch (error) {
          if (ethers.isError(error, "BAD_DATA") && error.value === "0x") {
            return null;
          }
          throw error;
        }
      }
    }

    const _abi$7 = [
      {
        inputs: [
          {
            internalType: "address",
            name: "emitter",
            type: "address"
          }
        ],
        name: "FailedContractCreation",
        type: "error"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "emitter",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "revertData",
            type: "bytes"
          }
        ],
        name: "FailedContractInitialisation",
        type: "error"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "emitter",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "revertData",
            type: "bytes"
          }
        ],
        name: "FailedEtherTransfer",
        type: "error"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "emitter",
            type: "address"
          }
        ],
        name: "InvalidNonceValue",
        type: "error"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "emitter",
            type: "address"
          }
        ],
        name: "InvalidSalt",
        type: "error"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "newContract",
            type: "address"
          },
          {
            indexed: true,
            internalType: "bytes32",
            name: "salt",
            type: "bytes32"
          }
        ],
        name: "ContractCreation",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        name: "ContractCreation",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "newContract",
            type: "address"
          },
          {
            indexed: true,
            internalType: "bytes32",
            name: "salt",
            type: "bytes32"
          }
        ],
        name: "Create3ProxyContractCreation",
        type: "event"
      },
      {
        inputs: [
          {
            internalType: "bytes32",
            name: "salt",
            type: "bytes32"
          },
          {
            internalType: "bytes32",
            name: "initCodeHash",
            type: "bytes32"
          }
        ],
        name: "computeCreate2Address",
        outputs: [
          {
            internalType: "address",
            name: "computedAddress",
            type: "address"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes32",
            name: "salt",
            type: "bytes32"
          },
          {
            internalType: "bytes32",
            name: "initCodeHash",
            type: "bytes32"
          },
          {
            internalType: "address",
            name: "deployer",
            type: "address"
          }
        ],
        name: "computeCreate2Address",
        outputs: [
          {
            internalType: "address",
            name: "computedAddress",
            type: "address"
          }
        ],
        stateMutability: "pure",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes32",
            name: "salt",
            type: "bytes32"
          },
          {
            internalType: "address",
            name: "deployer",
            type: "address"
          }
        ],
        name: "computeCreate3Address",
        outputs: [
          {
            internalType: "address",
            name: "computedAddress",
            type: "address"
          }
        ],
        stateMutability: "pure",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes32",
            name: "salt",
            type: "bytes32"
          }
        ],
        name: "computeCreate3Address",
        outputs: [
          {
            internalType: "address",
            name: "computedAddress",
            type: "address"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "nonce",
            type: "uint256"
          }
        ],
        name: "computeCreateAddress",
        outputs: [
          {
            internalType: "address",
            name: "computedAddress",
            type: "address"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "deployer",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "nonce",
            type: "uint256"
          }
        ],
        name: "computeCreateAddress",
        outputs: [
          {
            internalType: "address",
            name: "computedAddress",
            type: "address"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          }
        ],
        name: "deployCreate",
        outputs: [
          {
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes32",
            name: "salt",
            type: "bytes32"
          },
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          }
        ],
        name: "deployCreate2",
        outputs: [
          {
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          }
        ],
        name: "deployCreate2",
        outputs: [
          {
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes32",
            name: "salt",
            type: "bytes32"
          },
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "constructorAmount",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "initCallAmount",
                type: "uint256"
              }
            ],
            internalType: "struct CreateX.Values",
            name: "values",
            type: "tuple"
          },
          {
            internalType: "address",
            name: "refundAddress",
            type: "address"
          }
        ],
        name: "deployCreate2AndInit",
        outputs: [
          {
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "constructorAmount",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "initCallAmount",
                type: "uint256"
              }
            ],
            internalType: "struct CreateX.Values",
            name: "values",
            type: "tuple"
          }
        ],
        name: "deployCreate2AndInit",
        outputs: [
          {
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "constructorAmount",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "initCallAmount",
                type: "uint256"
              }
            ],
            internalType: "struct CreateX.Values",
            name: "values",
            type: "tuple"
          },
          {
            internalType: "address",
            name: "refundAddress",
            type: "address"
          }
        ],
        name: "deployCreate2AndInit",
        outputs: [
          {
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes32",
            name: "salt",
            type: "bytes32"
          },
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "constructorAmount",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "initCallAmount",
                type: "uint256"
              }
            ],
            internalType: "struct CreateX.Values",
            name: "values",
            type: "tuple"
          }
        ],
        name: "deployCreate2AndInit",
        outputs: [
          {
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes32",
            name: "salt",
            type: "bytes32"
          },
          {
            internalType: "address",
            name: "implementation",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        name: "deployCreate2Clone",
        outputs: [
          {
            internalType: "address",
            name: "proxy",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "implementation",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        name: "deployCreate2Clone",
        outputs: [
          {
            internalType: "address",
            name: "proxy",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          }
        ],
        name: "deployCreate3",
        outputs: [
          {
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes32",
            name: "salt",
            type: "bytes32"
          },
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          }
        ],
        name: "deployCreate3",
        outputs: [
          {
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes32",
            name: "salt",
            type: "bytes32"
          },
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "constructorAmount",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "initCallAmount",
                type: "uint256"
              }
            ],
            internalType: "struct CreateX.Values",
            name: "values",
            type: "tuple"
          }
        ],
        name: "deployCreate3AndInit",
        outputs: [
          {
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "constructorAmount",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "initCallAmount",
                type: "uint256"
              }
            ],
            internalType: "struct CreateX.Values",
            name: "values",
            type: "tuple"
          }
        ],
        name: "deployCreate3AndInit",
        outputs: [
          {
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes32",
            name: "salt",
            type: "bytes32"
          },
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "constructorAmount",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "initCallAmount",
                type: "uint256"
              }
            ],
            internalType: "struct CreateX.Values",
            name: "values",
            type: "tuple"
          },
          {
            internalType: "address",
            name: "refundAddress",
            type: "address"
          }
        ],
        name: "deployCreate3AndInit",
        outputs: [
          {
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "constructorAmount",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "initCallAmount",
                type: "uint256"
              }
            ],
            internalType: "struct CreateX.Values",
            name: "values",
            type: "tuple"
          },
          {
            internalType: "address",
            name: "refundAddress",
            type: "address"
          }
        ],
        name: "deployCreate3AndInit",
        outputs: [
          {
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "constructorAmount",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "initCallAmount",
                type: "uint256"
              }
            ],
            internalType: "struct CreateX.Values",
            name: "values",
            type: "tuple"
          }
        ],
        name: "deployCreateAndInit",
        outputs: [
          {
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes",
            name: "initCode",
            type: "bytes"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "constructorAmount",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "initCallAmount",
                type: "uint256"
              }
            ],
            internalType: "struct CreateX.Values",
            name: "values",
            type: "tuple"
          },
          {
            internalType: "address",
            name: "refundAddress",
            type: "address"
          }
        ],
        name: "deployCreateAndInit",
        outputs: [
          {
            internalType: "address",
            name: "newContract",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "implementation",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "data",
            type: "bytes"
          }
        ],
        name: "deployCreateClone",
        outputs: [
          {
            internalType: "address",
            name: "proxy",
            type: "address"
          }
        ],
        stateMutability: "payable",
        type: "function"
      }
    ];
    class CreateX__factory {
      static abi = _abi$7;
      static createInterface() {
        return new ethers.Interface(_abi$7);
      }
      static connect(address, runner) {
        return new ethers.Contract(address, _abi$7, runner);
      }
    }

    const _abi$6 = [
      {
        inputs: [],
        name: "aggregator",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "decimals",
        outputs: [
          {
            internalType: "uint8",
            name: "",
            type: "uint8"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "description",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "uint80",
            name: "_roundId",
            type: "uint80"
          }
        ],
        name: "getRoundData",
        outputs: [
          {
            internalType: "uint80",
            name: "roundId",
            type: "uint80"
          },
          {
            internalType: "int256",
            name: "answer",
            type: "int256"
          },
          {
            internalType: "uint256",
            name: "startedAt",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "updatedAt",
            type: "uint256"
          },
          {
            internalType: "uint80",
            name: "answeredInRound",
            type: "uint80"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "latestRoundData",
        outputs: [
          {
            internalType: "uint80",
            name: "roundId",
            type: "uint80"
          },
          {
            internalType: "int256",
            name: "answer",
            type: "int256"
          },
          {
            internalType: "uint256",
            name: "startedAt",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "updatedAt",
            type: "uint256"
          },
          {
            internalType: "uint80",
            name: "answeredInRound",
            type: "uint80"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "latestAnswer",
        outputs: [
          {
            internalType: "int256",
            name: "",
            type: "int256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "latestRound",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "version",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      }
    ];
    class DataFeed__factory {
      static abi = _abi$6;
      static createInterface() {
        return new ethers.Interface(_abi$6);
      }
      static connect(address, runner) {
        return new ethers.Contract(address, _abi$6, runner);
      }
    }

    const _abi$5 = [
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            indexed: true,
            internalType: "address",
            name: "spender",
            type: "address"
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "value",
            type: "uint256"
          }
        ],
        name: "Approval",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "from",
            type: "address"
          },
          {
            indexed: true,
            internalType: "address",
            name: "to",
            type: "address"
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "value",
            type: "uint256"
          }
        ],
        name: "Transfer",
        type: "event"
      },
      {
        inputs: [],
        name: "DOMAIN_SEPARATOR",
        outputs: [
          {
            internalType: "bytes32",
            name: "",
            type: "bytes32"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            internalType: "address",
            name: "spender",
            type: "address"
          }
        ],
        name: "allowance",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "spender",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256"
          }
        ],
        name: "approve",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool"
          }
        ],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "account",
            type: "address"
          }
        ],
        name: "balanceOf",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "decimals",
        outputs: [
          {
            internalType: "uint8",
            name: "",
            type: "uint8"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "name",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address"
          }
        ],
        name: "nonces",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            internalType: "address",
            name: "spender",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256"
          },
          {
            internalType: "uint8",
            name: "v",
            type: "uint8"
          },
          {
            internalType: "bytes32",
            name: "r",
            type: "bytes32"
          },
          {
            internalType: "bytes32",
            name: "s",
            type: "bytes32"
          }
        ],
        name: "permit",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [],
        name: "symbol",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "totalSupply",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "to",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256"
          }
        ],
        name: "transfer",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool"
          }
        ],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "from",
            type: "address"
          },
          {
            internalType: "address",
            name: "to",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "value",
            type: "uint256"
          }
        ],
        name: "transferFrom",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool"
          }
        ],
        stateMutability: "nonpayable",
        type: "function"
      }
    ];
    class ERC20__factory {
      static abi = _abi$5;
      static createInterface() {
        return new ethers.Interface(_abi$5);
      }
      static connect(address, runner) {
        return new ethers.Contract(address, _abi$5, runner);
      }
    }

    const _abi$4 = [
      {
        inputs: [
          {
            components: [
              {
                internalType: "address",
                name: "target",
                type: "address"
              },
              {
                internalType: "bytes",
                name: "callData",
                type: "bytes"
              }
            ],
            internalType: "struct Multicall3.Call[]",
            name: "calls",
            type: "tuple[]"
          }
        ],
        name: "aggregate",
        outputs: [
          {
            internalType: "uint256",
            name: "blockNumber",
            type: "uint256"
          },
          {
            internalType: "bytes[]",
            name: "returnData",
            type: "bytes[]"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            components: [
              {
                internalType: "address",
                name: "target",
                type: "address"
              },
              {
                internalType: "bool",
                name: "allowFailure",
                type: "bool"
              },
              {
                internalType: "bytes",
                name: "callData",
                type: "bytes"
              }
            ],
            internalType: "struct Multicall3.Call3[]",
            name: "calls",
            type: "tuple[]"
          }
        ],
        name: "aggregate3",
        outputs: [
          {
            components: [
              {
                internalType: "bool",
                name: "success",
                type: "bool"
              },
              {
                internalType: "bytes",
                name: "returnData",
                type: "bytes"
              }
            ],
            internalType: "struct Multicall3.Result[]",
            name: "returnData",
            type: "tuple[]"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            components: [
              {
                internalType: "address",
                name: "target",
                type: "address"
              },
              {
                internalType: "bool",
                name: "allowFailure",
                type: "bool"
              },
              {
                internalType: "uint256",
                name: "value",
                type: "uint256"
              },
              {
                internalType: "bytes",
                name: "callData",
                type: "bytes"
              }
            ],
            internalType: "struct Multicall3.Call3Value[]",
            name: "calls",
            type: "tuple[]"
          }
        ],
        name: "aggregate3Value",
        outputs: [
          {
            components: [
              {
                internalType: "bool",
                name: "success",
                type: "bool"
              },
              {
                internalType: "bytes",
                name: "returnData",
                type: "bytes"
              }
            ],
            internalType: "struct Multicall3.Result[]",
            name: "returnData",
            type: "tuple[]"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            components: [
              {
                internalType: "address",
                name: "target",
                type: "address"
              },
              {
                internalType: "bytes",
                name: "callData",
                type: "bytes"
              }
            ],
            internalType: "struct Multicall3.Call[]",
            name: "calls",
            type: "tuple[]"
          }
        ],
        name: "blockAndAggregate",
        outputs: [
          {
            internalType: "uint256",
            name: "blockNumber",
            type: "uint256"
          },
          {
            internalType: "bytes32",
            name: "blockHash",
            type: "bytes32"
          },
          {
            components: [
              {
                internalType: "bool",
                name: "success",
                type: "bool"
              },
              {
                internalType: "bytes",
                name: "returnData",
                type: "bytes"
              }
            ],
            internalType: "struct Multicall3.Result[]",
            name: "returnData",
            type: "tuple[]"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [],
        name: "getBasefee",
        outputs: [
          {
            internalType: "uint256",
            name: "basefee",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "blockNumber",
            type: "uint256"
          }
        ],
        name: "getBlockHash",
        outputs: [
          {
            internalType: "bytes32",
            name: "blockHash",
            type: "bytes32"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "getBlockNumber",
        outputs: [
          {
            internalType: "uint256",
            name: "blockNumber",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "getChainId",
        outputs: [
          {
            internalType: "uint256",
            name: "chainid",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "getCurrentBlockCoinbase",
        outputs: [
          {
            internalType: "address",
            name: "coinbase",
            type: "address"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "getCurrentBlockDifficulty",
        outputs: [
          {
            internalType: "uint256",
            name: "difficulty",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "getCurrentBlockGasLimit",
        outputs: [
          {
            internalType: "uint256",
            name: "gaslimit",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "getCurrentBlockTimestamp",
        outputs: [
          {
            internalType: "uint256",
            name: "timestamp",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "addr",
            type: "address"
          }
        ],
        name: "getEthBalance",
        outputs: [
          {
            internalType: "uint256",
            name: "balance",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "getLastBlockHash",
        outputs: [
          {
            internalType: "bytes32",
            name: "blockHash",
            type: "bytes32"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bool",
            name: "requireSuccess",
            type: "bool"
          },
          {
            components: [
              {
                internalType: "address",
                name: "target",
                type: "address"
              },
              {
                internalType: "bytes",
                name: "callData",
                type: "bytes"
              }
            ],
            internalType: "struct Multicall3.Call[]",
            name: "calls",
            type: "tuple[]"
          }
        ],
        name: "tryAggregate",
        outputs: [
          {
            components: [
              {
                internalType: "bool",
                name: "success",
                type: "bool"
              },
              {
                internalType: "bytes",
                name: "returnData",
                type: "bytes"
              }
            ],
            internalType: "struct Multicall3.Result[]",
            name: "returnData",
            type: "tuple[]"
          }
        ],
        stateMutability: "payable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bool",
            name: "requireSuccess",
            type: "bool"
          },
          {
            components: [
              {
                internalType: "address",
                name: "target",
                type: "address"
              },
              {
                internalType: "bytes",
                name: "callData",
                type: "bytes"
              }
            ],
            internalType: "struct Multicall3.Call[]",
            name: "calls",
            type: "tuple[]"
          }
        ],
        name: "tryBlockAndAggregate",
        outputs: [
          {
            internalType: "uint256",
            name: "blockNumber",
            type: "uint256"
          },
          {
            internalType: "bytes32",
            name: "blockHash",
            type: "bytes32"
          },
          {
            components: [
              {
                internalType: "bool",
                name: "success",
                type: "bool"
              },
              {
                internalType: "bytes",
                name: "returnData",
                type: "bytes"
              }
            ],
            internalType: "struct Multicall3.Result[]",
            name: "returnData",
            type: "tuple[]"
          }
        ],
        stateMutability: "payable",
        type: "function"
      }
    ];
    class Multicall__factory {
      static abi = _abi$4;
      static createInterface() {
        return new ethers.Interface(_abi$4);
      }
      static connect(address, runner) {
        return new ethers.Contract(address, _abi$4, runner);
      }
    }

    const _abi$3 = [
      {
        inputs: [
          {
            internalType: "contract MultiWrapper",
            name: "_multiWrapper",
            type: "address"
          },
          {
            internalType: "contract IOracle[]",
            name: "existingOracles",
            type: "address[]"
          },
          {
            internalType: "enum OffchainOracle.OracleType[]",
            name: "oracleTypes",
            type: "uint8[]"
          },
          {
            internalType: "contract IERC20[]",
            name: "existingConnectors",
            type: "address[]"
          },
          {
            internalType: "contract IERC20",
            name: "wBase",
            type: "address"
          },
          {
            internalType: "address",
            name: "owner_",
            type: "address"
          }
        ],
        stateMutability: "nonpayable",
        type: "constructor"
      },
      {
        inputs: [],
        name: "ArraysLengthMismatch",
        type: "error"
      },
      {
        inputs: [],
        name: "ConnectorAlreadyAdded",
        type: "error"
      },
      {
        inputs: [],
        name: "InvalidOracleTokenKind",
        type: "error"
      },
      {
        inputs: [],
        name: "MathOverflowedMulDiv",
        type: "error"
      },
      {
        inputs: [],
        name: "OracleAlreadyAdded",
        type: "error"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address"
          }
        ],
        name: "OwnableInvalidOwner",
        type: "error"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "account",
            type: "address"
          }
        ],
        name: "OwnableUnauthorizedAccount",
        type: "error"
      },
      {
        inputs: [],
        name: "SameTokens",
        type: "error"
      },
      {
        inputs: [],
        name: "TooBigThreshold",
        type: "error"
      },
      {
        inputs: [],
        name: "UnknownConnector",
        type: "error"
      },
      {
        inputs: [],
        name: "UnknownOracle",
        type: "error"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "contract IERC20",
            name: "connector",
            type: "address"
          }
        ],
        name: "ConnectorAdded",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "contract IERC20",
            name: "connector",
            type: "address"
          }
        ],
        name: "ConnectorRemoved",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "contract MultiWrapper",
            name: "multiWrapper",
            type: "address"
          }
        ],
        name: "MultiWrapperUpdated",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "contract IOracle",
            name: "oracle",
            type: "address"
          },
          {
            indexed: false,
            internalType: "enum OffchainOracle.OracleType",
            name: "oracleType",
            type: "uint8"
          }
        ],
        name: "OracleAdded",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: false,
            internalType: "contract IOracle",
            name: "oracle",
            type: "address"
          },
          {
            indexed: false,
            internalType: "enum OffchainOracle.OracleType",
            name: "oracleType",
            type: "uint8"
          }
        ],
        name: "OracleRemoved",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "previousOwner",
            type: "address"
          },
          {
            indexed: true,
            internalType: "address",
            name: "newOwner",
            type: "address"
          }
        ],
        name: "OwnershipTransferred",
        type: "event"
      },
      {
        inputs: [
          {
            internalType: "contract IERC20",
            name: "connector",
            type: "address"
          }
        ],
        name: "addConnector",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "contract IOracle",
            name: "oracle",
            type: "address"
          },
          {
            internalType: "enum OffchainOracle.OracleType",
            name: "oracleKind",
            type: "uint8"
          }
        ],
        name: "addOracle",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [],
        name: "connectors",
        outputs: [
          {
            internalType: "contract IERC20[]",
            name: "allConnectors",
            type: "address[]"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "contract IERC20",
            name: "srcToken",
            type: "address"
          },
          {
            internalType: "contract IERC20",
            name: "dstToken",
            type: "address"
          },
          {
            internalType: "bool",
            name: "useWrappers",
            type: "bool"
          }
        ],
        name: "getRate",
        outputs: [
          {
            internalType: "uint256",
            name: "weightedRate",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "contract IERC20",
            name: "srcToken",
            type: "address"
          },
          {
            internalType: "bool",
            name: "useSrcWrappers",
            type: "bool"
          }
        ],
        name: "getRateToEth",
        outputs: [
          {
            internalType: "uint256",
            name: "weightedRate",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "contract IERC20",
            name: "srcToken",
            type: "address"
          },
          {
            internalType: "bool",
            name: "useSrcWrappers",
            type: "bool"
          },
          {
            internalType: "contract IERC20[]",
            name: "customConnectors",
            type: "address[]"
          },
          {
            internalType: "uint256",
            name: "thresholdFilter",
            type: "uint256"
          }
        ],
        name: "getRateToEthWithCustomConnectors",
        outputs: [
          {
            internalType: "uint256",
            name: "weightedRate",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "contract IERC20",
            name: "srcToken",
            type: "address"
          },
          {
            internalType: "bool",
            name: "useSrcWrappers",
            type: "bool"
          },
          {
            internalType: "uint256",
            name: "thresholdFilter",
            type: "uint256"
          }
        ],
        name: "getRateToEthWithThreshold",
        outputs: [
          {
            internalType: "uint256",
            name: "weightedRate",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "contract IERC20",
            name: "srcToken",
            type: "address"
          },
          {
            internalType: "contract IERC20",
            name: "dstToken",
            type: "address"
          },
          {
            internalType: "bool",
            name: "useWrappers",
            type: "bool"
          },
          {
            internalType: "contract IERC20[]",
            name: "customConnectors",
            type: "address[]"
          },
          {
            internalType: "uint256",
            name: "thresholdFilter",
            type: "uint256"
          }
        ],
        name: "getRateWithCustomConnectors",
        outputs: [
          {
            internalType: "uint256",
            name: "weightedRate",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "contract IERC20",
            name: "srcToken",
            type: "address"
          },
          {
            internalType: "contract IERC20",
            name: "dstToken",
            type: "address"
          },
          {
            internalType: "bool",
            name: "useWrappers",
            type: "bool"
          },
          {
            internalType: "uint256",
            name: "thresholdFilter",
            type: "uint256"
          }
        ],
        name: "getRateWithThreshold",
        outputs: [
          {
            internalType: "uint256",
            name: "weightedRate",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "contract IERC20",
            name: "srcToken",
            type: "address"
          },
          {
            internalType: "bool",
            name: "useSrcWrappers",
            type: "bool"
          },
          {
            internalType: "contract IERC20[]",
            name: "customConnectors",
            type: "address[]"
          },
          {
            internalType: "uint256",
            name: "thresholdFilter",
            type: "uint256"
          }
        ],
        name: "getRatesAndWeightsToEthWithCustomConnectors",
        outputs: [
          {
            internalType: "uint256",
            name: "wrappedPrice",
            type: "uint256"
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "maxOracleWeight",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "size",
                type: "uint256"
              },
              {
                components: [
                  {
                    internalType: "uint256",
                    name: "rate",
                    type: "uint256"
                  },
                  {
                    internalType: "uint256",
                    name: "weight",
                    type: "uint256"
                  }
                ],
                internalType: "struct OraclePrices.OraclePrice[]",
                name: "oraclePrices",
                type: "tuple[]"
              }
            ],
            internalType: "struct OraclePrices.Data",
            name: "ratesAndWeights",
            type: "tuple"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "contract IERC20",
            name: "srcToken",
            type: "address"
          },
          {
            internalType: "contract IERC20",
            name: "dstToken",
            type: "address"
          },
          {
            internalType: "bool",
            name: "useWrappers",
            type: "bool"
          },
          {
            internalType: "contract IERC20[]",
            name: "customConnectors",
            type: "address[]"
          },
          {
            internalType: "uint256",
            name: "thresholdFilter",
            type: "uint256"
          }
        ],
        name: "getRatesAndWeightsWithCustomConnectors",
        outputs: [
          {
            internalType: "uint256",
            name: "wrappedPrice",
            type: "uint256"
          },
          {
            components: [
              {
                internalType: "uint256",
                name: "maxOracleWeight",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "size",
                type: "uint256"
              },
              {
                components: [
                  {
                    internalType: "uint256",
                    name: "rate",
                    type: "uint256"
                  },
                  {
                    internalType: "uint256",
                    name: "weight",
                    type: "uint256"
                  }
                ],
                internalType: "struct OraclePrices.OraclePrice[]",
                name: "oraclePrices",
                type: "tuple[]"
              }
            ],
            internalType: "struct OraclePrices.Data",
            name: "ratesAndWeights",
            type: "tuple"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "multiWrapper",
        outputs: [
          {
            internalType: "contract MultiWrapper",
            name: "",
            type: "address"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "oracles",
        outputs: [
          {
            internalType: "contract IOracle[]",
            name: "allOracles",
            type: "address[]"
          },
          {
            internalType: "enum OffchainOracle.OracleType[]",
            name: "oracleTypes",
            type: "uint8[]"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "owner",
        outputs: [
          {
            internalType: "address",
            name: "",
            type: "address"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "contract IERC20",
            name: "connector",
            type: "address"
          }
        ],
        name: "removeConnector",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "contract IOracle",
            name: "oracle",
            type: "address"
          },
          {
            internalType: "enum OffchainOracle.OracleType",
            name: "oracleKind",
            type: "uint8"
          }
        ],
        name: "removeOracle",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [],
        name: "renounceOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "contract MultiWrapper",
            name: "_multiWrapper",
            type: "address"
          }
        ],
        name: "setMultiWrapper",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "newOwner",
            type: "address"
          }
        ],
        name: "transferOwnership",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      }
    ];
    class OffchainOracle__factory {
      static abi = _abi$3;
      static createInterface() {
        return new ethers.Interface(_abi$3);
      }
      static connect(address, runner) {
        return new ethers.Contract(address, _abi$3, runner);
      }
    }

    const _abi$2 = [
      {
        inputs: [],
        name: "DECIMALS",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "baseFee",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "baseFeeScalar",
        outputs: [
          {
            internalType: "uint32",
            name: "",
            type: "uint32"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "blobBaseFee",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "blobBaseFeeScalar",
        outputs: [
          {
            internalType: "uint32",
            name: "",
            type: "uint32"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "decimals",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "pure",
        type: "function"
      },
      {
        inputs: [],
        name: "gasPrice",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes",
            name: "_data",
            type: "bytes"
          }
        ],
        name: "getL1Fee",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "_unsignedTxSize",
            type: "uint256"
          }
        ],
        name: "getL1FeeUpperBound",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "bytes",
            name: "_data",
            type: "bytes"
          }
        ],
        name: "getL1GasUsed",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "isEcotone",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "isFjord",
        outputs: [
          {
            internalType: "bool",
            name: "",
            type: "bool"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "l1BaseFee",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "overhead",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "scalar",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [],
        name: "setEcotone",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [],
        name: "setFjord",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [],
        name: "version",
        outputs: [
          {
            internalType: "string",
            name: "",
            type: "string"
          }
        ],
        stateMutability: "view",
        type: "function"
      }
    ];
    class OpGasPriceOracle__factory {
      static abi = _abi$2;
      static createInterface() {
        return new ethers.Interface(_abi$2);
      }
      static connect(address, runner) {
        return new ethers.Contract(address, _abi$2, runner);
      }
    }

    const _abi$1 = [
      {
        inputs: [
          {
            internalType: "uint256",
            name: "deadline",
            type: "uint256"
          }
        ],
        name: "AllowanceExpired",
        type: "error"
      },
      {
        inputs: [],
        name: "ExcessiveInvalidation",
        type: "error"
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "amount",
            type: "uint256"
          }
        ],
        name: "InsufficientAllowance",
        type: "error"
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "maxAmount",
            type: "uint256"
          }
        ],
        name: "InvalidAmount",
        type: "error"
      },
      {
        inputs: [],
        name: "InvalidContractSignature",
        type: "error"
      },
      {
        inputs: [],
        name: "InvalidNonce",
        type: "error"
      },
      {
        inputs: [],
        name: "InvalidSignature",
        type: "error"
      },
      {
        inputs: [],
        name: "InvalidSignatureLength",
        type: "error"
      },
      {
        inputs: [],
        name: "InvalidSigner",
        type: "error"
      },
      {
        inputs: [],
        name: "LengthMismatch",
        type: "error"
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "signatureDeadline",
            type: "uint256"
          }
        ],
        name: "SignatureExpired",
        type: "error"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            indexed: true,
            internalType: "address",
            name: "token",
            type: "address"
          },
          {
            indexed: true,
            internalType: "address",
            name: "spender",
            type: "address"
          },
          {
            indexed: false,
            internalType: "uint160",
            name: "amount",
            type: "uint160"
          },
          {
            indexed: false,
            internalType: "uint48",
            name: "expiration",
            type: "uint48"
          }
        ],
        name: "Approval",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            indexed: false,
            internalType: "address",
            name: "token",
            type: "address"
          },
          {
            indexed: false,
            internalType: "address",
            name: "spender",
            type: "address"
          }
        ],
        name: "Lockdown",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            indexed: true,
            internalType: "address",
            name: "token",
            type: "address"
          },
          {
            indexed: true,
            internalType: "address",
            name: "spender",
            type: "address"
          },
          {
            indexed: false,
            internalType: "uint48",
            name: "newNonce",
            type: "uint48"
          },
          {
            indexed: false,
            internalType: "uint48",
            name: "oldNonce",
            type: "uint48"
          }
        ],
        name: "NonceInvalidation",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            indexed: true,
            internalType: "address",
            name: "token",
            type: "address"
          },
          {
            indexed: true,
            internalType: "address",
            name: "spender",
            type: "address"
          },
          {
            indexed: false,
            internalType: "uint160",
            name: "amount",
            type: "uint160"
          },
          {
            indexed: false,
            internalType: "uint48",
            name: "expiration",
            type: "uint48"
          },
          {
            indexed: false,
            internalType: "uint48",
            name: "nonce",
            type: "uint48"
          }
        ],
        name: "Permit",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "word",
            type: "uint256"
          },
          {
            indexed: false,
            internalType: "uint256",
            name: "mask",
            type: "uint256"
          }
        ],
        name: "UnorderedNonceInvalidation",
        type: "event"
      },
      {
        inputs: [],
        name: "DOMAIN_SEPARATOR",
        outputs: [
          {
            internalType: "bytes32",
            name: "",
            type: "bytes32"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "",
            type: "address"
          },
          {
            internalType: "address",
            name: "",
            type: "address"
          },
          {
            internalType: "address",
            name: "",
            type: "address"
          }
        ],
        name: "allowance",
        outputs: [
          {
            internalType: "uint160",
            name: "amount",
            type: "uint160"
          },
          {
            internalType: "uint48",
            name: "expiration",
            type: "uint48"
          },
          {
            internalType: "uint48",
            name: "nonce",
            type: "uint48"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "token",
            type: "address"
          },
          {
            internalType: "address",
            name: "spender",
            type: "address"
          },
          {
            internalType: "uint160",
            name: "amount",
            type: "uint160"
          },
          {
            internalType: "uint48",
            name: "expiration",
            type: "uint48"
          }
        ],
        name: "approve",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "token",
            type: "address"
          },
          {
            internalType: "address",
            name: "spender",
            type: "address"
          },
          {
            internalType: "uint48",
            name: "newNonce",
            type: "uint48"
          }
        ],
        name: "invalidateNonces",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "wordPos",
            type: "uint256"
          },
          {
            internalType: "uint256",
            name: "mask",
            type: "uint256"
          }
        ],
        name: "invalidateUnorderedNonces",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            components: [
              {
                internalType: "address",
                name: "token",
                type: "address"
              },
              {
                internalType: "address",
                name: "spender",
                type: "address"
              }
            ],
            internalType: "struct IAllowanceTransfer.TokenSpenderPair[]",
            name: "approvals",
            type: "tuple[]"
          }
        ],
        name: "lockdown",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "",
            type: "address"
          },
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        name: "nonceBitmap",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            components: [
              {
                components: [
                  {
                    internalType: "address",
                    name: "token",
                    type: "address"
                  },
                  {
                    internalType: "uint160",
                    name: "amount",
                    type: "uint160"
                  },
                  {
                    internalType: "uint48",
                    name: "expiration",
                    type: "uint48"
                  },
                  {
                    internalType: "uint48",
                    name: "nonce",
                    type: "uint48"
                  }
                ],
                internalType: "struct IAllowanceTransfer.PermitDetails[]",
                name: "details",
                type: "tuple[]"
              },
              {
                internalType: "address",
                name: "spender",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "sigDeadline",
                type: "uint256"
              }
            ],
            internalType: "struct IAllowanceTransfer.PermitBatch",
            name: "permitBatch",
            type: "tuple"
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes"
          }
        ],
        name: "permit",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            components: [
              {
                components: [
                  {
                    internalType: "address",
                    name: "token",
                    type: "address"
                  },
                  {
                    internalType: "uint160",
                    name: "amount",
                    type: "uint160"
                  },
                  {
                    internalType: "uint48",
                    name: "expiration",
                    type: "uint48"
                  },
                  {
                    internalType: "uint48",
                    name: "nonce",
                    type: "uint48"
                  }
                ],
                internalType: "struct IAllowanceTransfer.PermitDetails",
                name: "details",
                type: "tuple"
              },
              {
                internalType: "address",
                name: "spender",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "sigDeadline",
                type: "uint256"
              }
            ],
            internalType: "struct IAllowanceTransfer.PermitSingle",
            name: "permitSingle",
            type: "tuple"
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes"
          }
        ],
        name: "permit",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            components: [
              {
                components: [
                  {
                    internalType: "address",
                    name: "token",
                    type: "address"
                  },
                  {
                    internalType: "uint256",
                    name: "amount",
                    type: "uint256"
                  }
                ],
                internalType: "struct ISignatureTransfer.TokenPermissions",
                name: "permitted",
                type: "tuple"
              },
              {
                internalType: "uint256",
                name: "nonce",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "deadline",
                type: "uint256"
              }
            ],
            internalType: "struct ISignatureTransfer.PermitTransferFrom",
            name: "permit",
            type: "tuple"
          },
          {
            components: [
              {
                internalType: "address",
                name: "to",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "requestedAmount",
                type: "uint256"
              }
            ],
            internalType: "struct ISignatureTransfer.SignatureTransferDetails",
            name: "transferDetails",
            type: "tuple"
          },
          {
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes"
          }
        ],
        name: "permitTransferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            components: [
              {
                components: [
                  {
                    internalType: "address",
                    name: "token",
                    type: "address"
                  },
                  {
                    internalType: "uint256",
                    name: "amount",
                    type: "uint256"
                  }
                ],
                internalType: "struct ISignatureTransfer.TokenPermissions[]",
                name: "permitted",
                type: "tuple[]"
              },
              {
                internalType: "uint256",
                name: "nonce",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "deadline",
                type: "uint256"
              }
            ],
            internalType: "struct ISignatureTransfer.PermitBatchTransferFrom",
            name: "permit",
            type: "tuple"
          },
          {
            components: [
              {
                internalType: "address",
                name: "to",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "requestedAmount",
                type: "uint256"
              }
            ],
            internalType: "struct ISignatureTransfer.SignatureTransferDetails[]",
            name: "transferDetails",
            type: "tuple[]"
          },
          {
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes"
          }
        ],
        name: "permitTransferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            components: [
              {
                components: [
                  {
                    internalType: "address",
                    name: "token",
                    type: "address"
                  },
                  {
                    internalType: "uint256",
                    name: "amount",
                    type: "uint256"
                  }
                ],
                internalType: "struct ISignatureTransfer.TokenPermissions",
                name: "permitted",
                type: "tuple"
              },
              {
                internalType: "uint256",
                name: "nonce",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "deadline",
                type: "uint256"
              }
            ],
            internalType: "struct ISignatureTransfer.PermitTransferFrom",
            name: "permit",
            type: "tuple"
          },
          {
            components: [
              {
                internalType: "address",
                name: "to",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "requestedAmount",
                type: "uint256"
              }
            ],
            internalType: "struct ISignatureTransfer.SignatureTransferDetails",
            name: "transferDetails",
            type: "tuple"
          },
          {
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            internalType: "bytes32",
            name: "witness",
            type: "bytes32"
          },
          {
            internalType: "string",
            name: "witnessTypeString",
            type: "string"
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes"
          }
        ],
        name: "permitWitnessTransferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            components: [
              {
                components: [
                  {
                    internalType: "address",
                    name: "token",
                    type: "address"
                  },
                  {
                    internalType: "uint256",
                    name: "amount",
                    type: "uint256"
                  }
                ],
                internalType: "struct ISignatureTransfer.TokenPermissions[]",
                name: "permitted",
                type: "tuple[]"
              },
              {
                internalType: "uint256",
                name: "nonce",
                type: "uint256"
              },
              {
                internalType: "uint256",
                name: "deadline",
                type: "uint256"
              }
            ],
            internalType: "struct ISignatureTransfer.PermitBatchTransferFrom",
            name: "permit",
            type: "tuple"
          },
          {
            components: [
              {
                internalType: "address",
                name: "to",
                type: "address"
              },
              {
                internalType: "uint256",
                name: "requestedAmount",
                type: "uint256"
              }
            ],
            internalType: "struct ISignatureTransfer.SignatureTransferDetails[]",
            name: "transferDetails",
            type: "tuple[]"
          },
          {
            internalType: "address",
            name: "owner",
            type: "address"
          },
          {
            internalType: "bytes32",
            name: "witness",
            type: "bytes32"
          },
          {
            internalType: "string",
            name: "witnessTypeString",
            type: "string"
          },
          {
            internalType: "bytes",
            name: "signature",
            type: "bytes"
          }
        ],
        name: "permitWitnessTransferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            components: [
              {
                internalType: "address",
                name: "from",
                type: "address"
              },
              {
                internalType: "address",
                name: "to",
                type: "address"
              },
              {
                internalType: "uint160",
                name: "amount",
                type: "uint160"
              },
              {
                internalType: "address",
                name: "token",
                type: "address"
              }
            ],
            internalType: "struct IAllowanceTransfer.AllowanceTransferDetails[]",
            name: "transferDetails",
            type: "tuple[]"
          }
        ],
        name: "transferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [
          {
            internalType: "address",
            name: "from",
            type: "address"
          },
          {
            internalType: "address",
            name: "to",
            type: "address"
          },
          {
            internalType: "uint160",
            name: "amount",
            type: "uint160"
          },
          {
            internalType: "address",
            name: "token",
            type: "address"
          }
        ],
        name: "transferFrom",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      }
    ];
    class Permit2__factory {
      static abi = _abi$1;
      static createInterface() {
        return new ethers.Interface(_abi$1);
      }
      static connect(address, runner) {
        return new ethers.Contract(address, _abi$1, runner);
      }
    }

    const _abi = [
      {
        constant: true,
        inputs: [],
        name: "name",
        outputs: [
          {
            name: "",
            type: "string"
          }
        ],
        payable: false,
        stateMutability: "view",
        type: "function"
      },
      {
        constant: false,
        inputs: [
          {
            name: "guy",
            type: "address"
          },
          {
            name: "wad",
            type: "uint256"
          }
        ],
        name: "approve",
        outputs: [
          {
            name: "",
            type: "bool"
          }
        ],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        constant: true,
        inputs: [],
        name: "totalSupply",
        outputs: [
          {
            name: "",
            type: "uint256"
          }
        ],
        payable: false,
        stateMutability: "view",
        type: "function"
      },
      {
        constant: false,
        inputs: [
          {
            name: "src",
            type: "address"
          },
          {
            name: "dst",
            type: "address"
          },
          {
            name: "wad",
            type: "uint256"
          }
        ],
        name: "transferFrom",
        outputs: [
          {
            name: "",
            type: "bool"
          }
        ],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        constant: false,
        inputs: [
          {
            name: "wad",
            type: "uint256"
          }
        ],
        name: "withdraw",
        outputs: [],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        constant: true,
        inputs: [],
        name: "decimals",
        outputs: [
          {
            name: "",
            type: "uint8"
          }
        ],
        payable: false,
        stateMutability: "view",
        type: "function"
      },
      {
        constant: true,
        inputs: [
          {
            name: "",
            type: "address"
          }
        ],
        name: "balanceOf",
        outputs: [
          {
            name: "",
            type: "uint256"
          }
        ],
        payable: false,
        stateMutability: "view",
        type: "function"
      },
      {
        constant: true,
        inputs: [],
        name: "symbol",
        outputs: [
          {
            name: "",
            type: "string"
          }
        ],
        payable: false,
        stateMutability: "view",
        type: "function"
      },
      {
        constant: false,
        inputs: [
          {
            name: "dst",
            type: "address"
          },
          {
            name: "wad",
            type: "uint256"
          }
        ],
        name: "transfer",
        outputs: [
          {
            name: "",
            type: "bool"
          }
        ],
        payable: false,
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        constant: false,
        inputs: [],
        name: "deposit",
        outputs: [],
        payable: true,
        stateMutability: "payable",
        type: "function"
      },
      {
        constant: true,
        inputs: [
          {
            name: "",
            type: "address"
          },
          {
            name: "",
            type: "address"
          }
        ],
        name: "allowance",
        outputs: [
          {
            name: "",
            type: "uint256"
          }
        ],
        payable: false,
        stateMutability: "view",
        type: "function"
      },
      {
        payable: true,
        stateMutability: "payable",
        type: "fallback"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: "src",
            type: "address"
          },
          {
            indexed: true,
            name: "guy",
            type: "address"
          },
          {
            indexed: false,
            name: "wad",
            type: "uint256"
          }
        ],
        name: "Approval",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: "src",
            type: "address"
          },
          {
            indexed: true,
            name: "dst",
            type: "address"
          },
          {
            indexed: false,
            name: "wad",
            type: "uint256"
          }
        ],
        name: "Transfer",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: "dst",
            type: "address"
          },
          {
            indexed: false,
            name: "wad",
            type: "uint256"
          }
        ],
        name: "Deposit",
        type: "event"
      },
      {
        anonymous: false,
        inputs: [
          {
            indexed: true,
            name: "src",
            type: "address"
          },
          {
            indexed: false,
            name: "wad",
            type: "uint256"
          }
        ],
        name: "Withdrawal",
        type: "event"
      }
    ];
    class WETH__factory {
      static abi = _abi;
      static createInterface() {
        return new ethers.Interface(_abi);
      }
      static connect(address, runner) {
        return new ethers.Contract(address, _abi, runner);
      }
    }

    var index = /*#__PURE__*/Object.freeze({
        __proto__: null,
        CreateX__factory: CreateX__factory,
        DataFeed__factory: DataFeed__factory,
        ERC20__factory: ERC20__factory,
        Multicall__factory: Multicall__factory,
        OffchainOracle__factory: OffchainOracle__factory,
        OpGasPriceOracle__factory: OpGasPriceOracle__factory,
        Permit2__factory: Permit2__factory,
        WETH__factory: WETH__factory
    });

    if (!BigInt.prototype.toJSON) {
      BigInt.prototype.toJSON = function() {
        return this.toString();
      };
    }
    const isNode = false;
    function createBatchRateConfig(ratePerSecond, maxBatch = 5, delays = 1e3) {
      if (ratePerSecond < 1) throw new Error("ratePerSecond must be >= 1");
      if (maxBatch < 1) throw new Error("maxBatch must be >= 1");
      const _delays = delays > 1e3 ? delays : 1e3;
      const ratePerBatch = ratePerSecond * (_delays / 1e3);
      const batch = Math.min(maxBatch, Math.floor(ratePerBatch));
      const safeBatch = Math.max(batch, 1);
      const concurrency = Math.max(1, Math.floor(ratePerBatch / safeBatch));
      return {
        concurrency,
        batchSize: safeBatch,
        delays
      };
    }
    function createBlockTags(fromBlock, toBlock, batchSize = 1e3, reverse = false) {
      const batches = [];
      if (toBlock - fromBlock > batchSize) {
        for (let i = fromBlock; i < toBlock + 1; i += batchSize) {
          const j = i + batchSize - 1 > toBlock ? toBlock : i + batchSize - 1;
          batches.push({ fromBlock: i, toBlock: j });
        }
      } else if (toBlock - fromBlock >= 0) {
        batches.push({ fromBlock, toBlock });
      } else {
        throw new Error(`Invalid block range ${fromBlock}~${toBlock}`);
      }
      if (reverse) {
        batches.reverse();
      }
      return batches;
    }
    function range(start, stop, step = 1) {
      return Array(Math.ceil((stop - start) / step) + 1).fill(start).map((x, y) => x + y * step);
    }
    function chunk(arr, size) {
      return [...Array(Math.ceil(arr.length / size))].map((_, i) => arr.slice(size * i, size + size * i));
    }
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    const crypto = globalThis.crypto;
    async function digest(bytes, algorithm = "SHA-256") {
      return new Uint8Array(await crypto.subtle.digest(algorithm, bytes));
    }
    async function digestHex(hexStr, algorithm = "SHA-256") {
      return bytesToHex(await digest(hexToBytes(hexStr), algorithm));
    }
    function rBytes(length = 32) {
      return crypto.getRandomValues(new Uint8Array(length));
    }
    function bufferToBytes(b) {
      return Uint8Array.from(b);
    }
    function concatBytes(...arrays) {
      const totalSize = arrays.reduce((acc, e) => acc + e.length, 0);
      const merged = new Uint8Array(totalSize);
      arrays.forEach((array, i, arrays2) => {
        const offset = arrays2.slice(0, i).reduce((acc, e) => acc + e.length, 0);
        merged.set(array, offset);
      });
      return merged;
    }
    function hexToBytes(input) {
      let hex = typeof input === "bigint" ? input.toString(16) : input;
      if (hex.startsWith("0x")) {
        hex = hex.slice(2);
      }
      if (hex.length % 2 !== 0) {
        hex = "0" + hex;
      }
      return Uint8Array.from(hex.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));
    }
    function bytesToHex(bytes) {
      return "0x" + Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
    }
    function toEvenHex(hexStr) {
      if (hexStr.startsWith("0x")) {
        hexStr = hexStr.slice(2);
      }
      if (hexStr.length % 2 !== 0) {
        hexStr = "0" + hexStr;
      }
      return "0x" + hexStr;
    }
    function toFixedHex(numberish, length = 32) {
      return "0x" + BigInt(numberish).toString(16).padStart(length * 2, "0");
    }
    function base64ToBytes(base64) {
      return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    }
    function bytesToBase64(bytes) {
      return btoa(bytes.reduce((data, byte) => data + String.fromCharCode(byte), ""));
    }
    function base64ToHex(base64) {
      return bytesToHex(base64ToBytes(base64));
    }
    function hexToBase64(hex) {
      return bytesToBase64(hexToBytes(hex));
    }
    function isHex(value) {
      return /^0x[0-9a-fA-F]*$/.test(value);
    }

    function isDeferred(value) {
      return value && typeof value === "object" && "getTopicFilter" in value && typeof value.getTopicFilter === "function" && value.fragment;
    }
    async function getSubInfo(_interface, event) {
      let topics;
      let fragment = null;
      if (Array.isArray(event)) {
        const topicHashify = function(name) {
          if (ethers.isHexString(name, 32)) {
            return name;
          }
          const fragment2 = _interface.getEvent(name);
          ethers.assertArgument(fragment2, "unknown fragment", "name", name);
          return fragment2.topicHash;
        };
        topics = event.map((e) => {
          if (e == null) {
            return null;
          }
          if (Array.isArray(e)) {
            return e.map(topicHashify);
          }
          return topicHashify(e);
        });
      } else if (event === "*") {
        topics = [null];
      } else if (typeof event === "string") {
        if (ethers.isHexString(event, 32)) {
          topics = [event];
        } else {
          fragment = _interface.getEvent(event);
          ethers.assertArgument(fragment, "unknown fragment", "event", event);
          topics = [fragment.topicHash];
        }
      } else if (isDeferred(event)) {
        topics = await event.getTopicFilter();
      } else if ("fragment" in event) {
        fragment = event.fragment;
        topics = [fragment.topicHash];
      } else {
        ethers.assertArgument(false, "unknown event name", "event", event);
      }
      topics = topics.map((t) => {
        if (t == null) {
          return null;
        }
        if (Array.isArray(t)) {
          const items = Array.from(new Set(t.map((t2) => t2.toLowerCase())).values());
          if (items.length === 1) {
            return items[0];
          }
          items.sort();
          return items;
        }
        return t.toLowerCase();
      });
      const tag = topics.map((t) => {
        if (t == null) {
          return "null";
        }
        if (Array.isArray(t)) {
          return t.join("|");
        }
        return t;
      }).join("&");
      return { fragment, tag, topics };
    }

    async function multiQueryFilter({
      address,
      provider,
      contract,
      event,
      fromBlock,
      toBlock
    }) {
      if (!address && contract) {
        address = contract.target;
      } else if (address === "*") {
        address = void 0;
      }
      if (!provider && contract) {
        provider = contract.runner?.provider || contract.runner;
      }
      if (!event) {
        event = "*";
      }
      if (!fromBlock && fromBlock !== 0) {
        fromBlock = 0;
      }
      if (!toBlock && toBlock !== 0) {
        toBlock = "latest";
      }
      let fragment = null, topics = [null];
      if (contract) {
        ({ fragment, topics } = await getSubInfo(contract.interface, event));
      }
      const filter = {
        address,
        topics,
        fromBlock,
        toBlock
      };
      ethers.assert(provider, "contract runner does not have a provider", "UNSUPPORTED_OPERATION", {
        operation: "queryFilter"
      });
      return (await provider.getLogs(filter)).map((log) => {
        let foundFragment = fragment;
        if (foundFragment == null && contract) {
          try {
            foundFragment = contract.interface.getEvent(log.topics[0]);
          } catch {
          }
        }
        if (foundFragment && contract) {
          try {
            return new ethers.EventLog(log, contract.interface, foundFragment);
          } catch (error) {
            return new ethers.UndecodedEventLog(log, error);
          }
        }
        return new ethers.Log(log, provider);
      });
    }

    async function getBlockReceipts(provider, blockTag, network) {
      const _provider = provider;
      const _network = network || await provider.getNetwork();
      const parsedBlock = blockTag ? _provider._getBlockTag(blockTag) : "latest";
      const blockReceipts = await _provider.send("eth_getBlockReceipts", [parsedBlock]);
      if (!blockReceipts) {
        throw new Error(`No block receipts for ${blockTag}`);
      }
      return blockReceipts.map((r) => _provider._wrapTransactionReceipt(r, _network));
    }

    function formatCallTrace(params, txHash, blockParams) {
      return {
        from: params.from ? ethers.getAddress(params.from) : "",
        gas: Number(params.gas || 0),
        gasUsed: Number(params.gasUsed || 0),
        to: params.to ? ethers.getAddress(params.to) : "",
        input: params.input,
        output: params.output,
        calls: params.calls,
        value: BigInt(params.value || 0),
        type: params.type,
        blockNumber: blockParams.number,
        blockHash: blockParams.hash || void 0,
        txHash
      };
    }
    async function traceBlock(provider, blockTag, onlyTopCall = false) {
      const parsedBlock = blockTag ? provider._getBlockTag(blockTag) : "latest";
      const method = parsedBlock.length === 66 ? "debug_traceBlockByHash" : "debug_traceBlockByNumber";
      const [block, resp] = await Promise.all([
        typeof blockTag === "number" ? { number: blockTag, hash: void 0 } : provider.getBlock(parsedBlock),
        provider.send(method, [
          parsedBlock,
          {
            tracer: "callTracer",
            traceConfig: {
              onlyTopCall
            }
          }
        ])
      ]);
      if (!block) {
        throw new Error(`Invalid block for ${blockTag}`);
      }
      if (!resp) {
        throw new Error(`No trace results for block ${blockTag}`);
      }
      return resp.map(
        ({ txHash, result }) => formatCallTrace(result, txHash, block)
      );
    }
    async function traceTransaction(provider, hash, onlyTopCall = false, txResp) {
      const [tx, resp] = await Promise.all([
        txResp || provider.getTransaction(hash),
        provider.send("debug_traceTransaction", [
          hash,
          {
            tracer: "callTracer",
            traceConfig: {
              onlyTopCall
            }
          }
        ])
      ]);
      if (!tx) {
        throw new Error(`Invalid tx for ${tx}`);
      }
      if (!resp) {
        throw new Error(`No trace results for tx ${hash}`);
      }
      return formatCallTrace(resp, hash, {
        number: tx.blockNumber,
        hash: tx.blockHash
      });
    }

    async function getProof(provider, contractAddress, storageKeys, blockTag) {
      const _provider = provider;
      const storageKey = typeof storageKeys === "string" ? [storageKeys] : storageKeys;
      return _provider.send("eth_getProof", [
        contractAddress,
        storageKey,
        blockTag ? _provider._getBlockTag(blockTag) : "latest"
      ]);
    }
    async function getStorageAt(provider, contract, storageKey, blockTag) {
      const _provider = provider;
      return _provider.send("eth_getStorageAt", [
        contract,
        ethers.toQuantity(storageKey),
        blockTag ? _provider._getBlockTag(blockTag) : "latest"
      ]);
    }

    async function createBatchRequest(params = {}, type, inputs, outputFunc) {
      const concurrencySize = params.concurrencySize || 10;
      const batchSize = params.batchSize || 10;
      const retryMax = params.retryMax || 2;
      const retryOn = params.retryOn || 500;
      let chunkIndex = 0;
      const results = [];
      for (const chunks of chunk(inputs, concurrencySize * batchSize)) {
        const timeStart = Date.now();
        const chunksResult = (await Promise.all(
          chunk(chunks, batchSize).map(async (_inputs, batchIndex) => {
            await sleep(40 * batchIndex);
            return (async () => {
              let retries = 0;
              let err;
              while (retries <= retryMax) {
                try {
                  return await Promise.all(_inputs.map((input) => outputFunc(input)));
                } catch (e) {
                  retries++;
                  err = e;
                  await sleep(retryOn);
                }
              }
              throw err;
            })();
          })
        )).flat();
        results.push(...chunksResult);
        chunkIndex += chunks.length;
        if (params.onProgress) {
          params.onProgress({
            type,
            chunkIndex,
            chunkLength: inputs.length,
            chunks,
            chunksResult,
            resultLength: chunksResult.flat().length
          });
        }
        if (params.delays && Date.now() - timeStart < params.delays) {
          await sleep(params.delays - (Date.now() - timeStart));
        }
      }
      return results;
    }
    class EthersBatcher {
      ratePerSecond;
      eventRange;
      // eth_getLogs block range
      concurrencySize;
      batchSize;
      delays;
      reverse;
      retryMax;
      // Max retry count
      retryOn;
      // Retry on millisecond
      onProgress;
      /**
       * Helper class to fetch large amounts of blocks, transactions, contract events,
       * and storage using batching and concurrency.
       * @param {EthersBatcherParams} [params] Object with the following optional properties:
       *  - ratePerSecond {number}: Maximum requests per second (default 10)
       *  - eventRange {number}: Default block range for event queries (default 5000)
       *  - concurrencySize {number}: Number of concurrent batch workers (defaults based on ratePerSecond)
       *  - batchSize {number}: Number of requests per sub-batch (defaults based on ratePerSecond)
       *  - delays {number}: Delay interval between batches in ms (default: 1000)
       *  - reverse {boolean}: If true, processes batches in reverse block order
       *  - retryMax {number}: Number of retries for failed batches (default 2)
       *  - retryOn {number}: Milliseconds to wait before retrying (default 500)
       *  - onProgress {BatchOnProgress}: Optional progress callback
       */
      constructor({
        ratePerSecond,
        eventRange,
        concurrencySize,
        batchSize: maxBatch,
        delays: _delays,
        reverse,
        retryMax,
        retryOn,
        onProgress
      } = {}) {
        this.ratePerSecond = ratePerSecond || 10;
        this.eventRange = eventRange || 5e3;
        const { concurrency, batchSize, delays } = createBatchRateConfig(
          this.ratePerSecond,
          maxBatch,
          _delays
        );
        this.concurrencySize = concurrencySize || concurrency;
        this.batchSize = batchSize;
        this.delays = delays;
        this.reverse = reverse ?? false;
        this.retryMax = retryMax || 2;
        this.retryOn = retryOn || 500;
        this.onProgress = onProgress;
      }
      async createBatchRequest(type, inputs, outputFunc) {
        return createBatchRequest(this, type, inputs, outputFunc);
      }
      /**
       * Batch function to fetch multiple blocks in parallel.
       * @param provider RPC provider.
       * @param blockTags List of block numbers or tags.
       * @param prefetchTxs True to also fetch transactions.
       * @returns Array of Block objects.
       */
      async getBlocks(provider, blockTags, prefetchTxs) {
        return await this.createBatchRequest("Blocks", blockTags, async (blockTag) => {
          const block = await provider.getBlock(blockTag, prefetchTxs);
          if (!block) {
            throw new Error(`No block for ${blockTag}`);
          }
          return block;
        });
      }
      /**
       * Fetches transactions by their hashes in batches.
       * @param provider Provider to use.
       * @param txids Array of transaction hashes.
       * @returns Array of TransactionResponse objects.
       */
      async getTransactions(provider, txids) {
        return await this.createBatchRequest(
          "Transactions",
          txids,
          async (txid) => {
            const tx = await provider.getTransaction(txid);
            if (!tx) {
              throw new Error(`No tx for ${txid}`);
            }
            return tx;
          }
        );
      }
      /**
       * Fetches multiple transaction receipts concurrently.
       * @param provider Provider to use.
       * @param txids Array of transaction hashes.
       * @returns Array of TransactionReceipt objects.
       */
      async getTransactionReceipts(provider, txids) {
        return await this.createBatchRequest(
          "TransactionReceipts",
          txids,
          async (txid) => {
            const tx = await provider.getTransactionReceipt(txid);
            if (!tx) {
              throw new Error(`No tx for ${txid}`);
            }
            return tx;
          }
        );
      }
      /**
       * Fetches receipts for all transactions in specified blocks.
       * @param provider JsonRpcProvider instance.
       * @param blockTags Block tags or numbers.
       * @returns Array of receipts.
       */
      async getBlockReceipts(provider, blockTags) {
        const network = await provider.getNetwork();
        return (await this.createBatchRequest(
          "BlockReceipts",
          blockTags,
          async (blockTag) => {
            return getBlockReceipts(provider, blockTag, network);
          }
        )).flat();
      }
      /**
       * Returns internal call traces for all transactions in each block.
       * @param provider Provider.
       * @param blockTags Block tags or numbers.
       * @param onlyTopCall If true, only fetch top-level calls.
       * @returns All call traces in those blocks.
       */
      async traceBlock(provider, blockTags, onlyTopCall) {
        return (await this.createBatchRequest(
          "InternalTransactions",
          blockTags,
          async (blockTag) => {
            return traceBlock(provider, blockTag, onlyTopCall);
          }
        )).flat();
      }
      /**
       * Returns internal call traces for specified transactions.
       * @param provider Provider.
       * @param txids Array of transaction hashes.
       * @param onlyTopCall If true, only fetch top-level call.
       * @returns CallTrace array for each transaction.
       */
      async traceTransaction(provider, txids, onlyTopCall) {
        return await this.createBatchRequest(
          "InternalTransactions",
          txids,
          async (txid) => {
            return traceTransaction(provider, txid, onlyTopCall);
          }
        );
      }
      /**
       * Fetch batches of event logs for given range (and contract/event).
       * @param args Query settings {address, provider, contract, event, fromBlock, toBlock}
       * @returns Array of Log/EventLog.
       */
      async getEvents({
        address,
        provider,
        contract,
        event = "*",
        fromBlock = 0,
        toBlock
      }) {
        if (!toBlock) {
          toBlock = await (provider || contract?.runner?.provider || contract?.runner).getBlockNumber();
        }
        const eventTags = createBlockTags(fromBlock, toBlock, this.eventRange, this.reverse);
        return (await this.createBatchRequest(
          "Events",
          eventTags,
          async ({ fromBlock: fromBlock2, toBlock: toBlock2 }) => {
            if (address || !contract) {
              return await multiQueryFilter({
                address,
                provider,
                contract,
                event,
                fromBlock: fromBlock2,
                toBlock: toBlock2
              });
            }
            return await contract.queryFilter(event, fromBlock2, toBlock2);
          }
        )).flat();
      }
      /**
       * Fetches arbitrary contract storage slots at a target block.
       * @param provider Provider.
       * @param contractAddress Target contract address.
       * @param storageKeys Keys to fetch.
       * @param blockTag Block number or tag.
       * @returns Array of string values.
       */
      async getStorageAt(provider, contractAddress, storageKeys, blockTag) {
        return await this.createBatchRequest(
          "Storages",
          storageKeys,
          async (_storageKeys) => {
            return getStorageAt(provider, contractAddress, _storageKeys, blockTag);
          }
        );
      }
      /**
       * Finds a storage slot in the given range where the value is non-zero.
       * @param provider Provider instance.
       * @param contractAddress Target contract.
       * @param storageKeyGetter Function mapping an index to a storage slot.
       * @param blockTag Block context.
       * @param fromIndex Inclusive start index.
       * @param toIndex Inclusive end index.
       * @returns First index/slot found (or undefined if not found).
       */
      async findStorageKey(provider, contractAddress, storageKeyGetter, blockTag, fromIndex = 0, toIndex = 30) {
        const storageBatches = createBlockTags(
          fromIndex,
          toIndex,
          this.batchSize * this.concurrencySize,
          this.reverse
        );
        for (const { fromBlock, toBlock } of storageBatches) {
          const indexes = range(fromBlock, toBlock);
          const storageKeys = indexes.map((r) => storageKeyGetter(r));
          const storages = await this.getStorageAt(provider, contractAddress, storageKeys, blockTag);
          const foundKeyIndex = storages.findIndex((s) => BigInt(s));
          if (foundKeyIndex > -1) {
            return {
              storageSlot: indexes[foundKeyIndex],
              storageKey: storageKeys[foundKeyIndex]
            };
          }
        }
      }
    }

    const MULTICALL_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";
    async function multicall(multi, calls, overrides = {}) {
      const calldata = calls.map(({ contract, address, interface: cInterface, name, params, allowFailure }) => {
        const target = contract?.target || address;
        const _interface = contract?.interface || cInterface;
        return {
          target,
          callData: _interface.encodeFunctionData(name, params),
          allowFailure: allowFailure ?? false
        };
      });
      return (await multi.aggregate3.staticCall(calldata, overrides)).map(
        ([success, data], i) => {
          const { contract, interface: cInterface, name } = calls[i];
          const _interface = contract?.interface || cInterface;
          const _result = success && data !== "0x" ? _interface.decodeFunctionResult(name, data) : data;
          return Array.isArray(_result) && _result.length === 1 ? _result[0] : _result;
        }
      );
    }

    async function fetchBlockHashes(provider, knownBlock, depth = 80) {
      const multicall = provider.multicall || Multicall__factory.connect(MULTICALL_ADDRESS, provider);
      const head = await provider.getBlockNumber();
      if (!knownBlock) {
        knownBlock = head;
      }
      const blocks = await Promise.all(
        range(knownBlock + 1 - depth, knownBlock).map(async (number) => {
          const outsideState = number + 100 <= head;
          if (!outsideState) {
            try {
              const hash2 = await multicall.getBlockHash(number);
              return { number, hash: hash2 };
            } catch {
            }
          }
          const { hash } = await provider.getBlock(number) || {};
          if (!hash) {
            throw new Error(`Block hash ${number} not available`);
          }
          return { number, hash };
        })
      );
      return blocks;
    }
    function compareBlockHashes(fromLocal, fromNode) {
      fromLocal = fromLocal.sort((a, b) => a.number - b.number);
      for (const localBlock of fromLocal) {
        const nodeBlock = fromNode.find((a) => a.number === localBlock.number);
        if (!nodeBlock?.hash) {
          continue;
        }
        if (nodeBlock.hash !== localBlock.hash) {
          return localBlock.number;
        }
      }
    }

    function formatFeeHistory(result, historicalBlocks, includePending) {
      let blockNum = Number(result.oldestBlock ?? 0);
      let index = 0;
      const blocks = [];
      while (blockNum < Number(result.oldestBlock ?? 0) + historicalBlocks) {
        blocks.push({
          number: blockNum,
          gasUsedRatio: Number(result.gasUsedRatio?.[index] ?? 0),
          baseFeePerGas: BigInt(result.baseFeePerGas?.[index] ?? 0),
          priorityFeePerGas: result.reward?.[index]?.map((x) => BigInt(x)) || []
        });
        blockNum++;
        index++;
      }
      if (includePending) {
        blocks.push({
          number: "pending",
          gasUsedRatio: NaN,
          baseFeePerGas: BigInt(result.baseFeePerGas?.[historicalBlocks] ?? 0),
          priorityFeePerGas: []
        });
      }
      const { baseFeePerGasAvg, priorityFeePerGasAvg } = blocks.reduce(
        (acc, curr, index2) => {
          acc.baseFeePerGasAvg += curr.baseFeePerGas;
          curr.priorityFeePerGas.forEach((gas, i) => {
            if (!acc.priorityFeePerGasAvg[i]) {
              acc.priorityFeePerGasAvg[i] = 0n;
            }
            if (gas) {
              acc.priorityFeePerGasAvg[i] += gas;
            }
          });
          if (blocks.length === index2 + 1) {
            acc.baseFeePerGasAvg = acc.baseFeePerGasAvg / BigInt(blocks.length);
            acc.priorityFeePerGasAvg = acc.priorityFeePerGasAvg.map((gas) => {
              return gas ? gas / BigInt(blocks.length) : 0n;
            });
          }
          return acc;
        },
        {
          baseFeePerGasAvg: 0n,
          priorityFeePerGasAvg: []
        }
      );
      return {
        blocks,
        baseFeePerGasAvg,
        priorityFeePerGasAvg
      };
    }
    function getGasPrice(feeData) {
      if (feeData.maxFeePerGas) {
        const maxPriorityFeePerGas = feeData.maxPriorityFeePerGas || 0n;
        const maxFeePerGas = feeData.maxFeePerGas <= maxPriorityFeePerGas ? maxPriorityFeePerGas + 10n : feeData.maxFeePerGas;
        return maxFeePerGas + maxPriorityFeePerGas;
      }
      return feeData.gasPrice || 0n;
    }

    function getUrlFunc(options) {
      return async (req, signal) => {
        let timer;
        try {
          const init = {
            ...options || {},
            method: req.method || "POST",
            headers: req.headers,
            body: req.body
          };
          const timeout = options?.timeout || req.timeout;
          if (timeout) {
            const controller = new AbortController();
            init.signal = controller.signal;
            timer = setTimeout(() => {
              controller.abort();
            }, timeout);
            if (signal) {
              ethers.assert(
                signal === null || !signal.cancelled,
                "request cancelled before sending",
                "CANCELLED"
              );
              signal.addListener(() => {
                controller.abort();
              });
            }
          }
          const resp = await fetch(req.url, init);
          const headers = {};
          resp.headers.forEach((value, key) => {
            headers[key.toLowerCase()] = value;
          });
          const respBody = await resp.arrayBuffer();
          const body = respBody ? new Uint8Array(respBody) : null;
          return {
            statusCode: resp.status,
            statusMessage: resp.statusText,
            headers,
            body
          };
        } finally {
          clearTimeout(timer);
        }
      };
    }

    function toJson(value) {
      if (value == null) {
        return null;
      }
      return value.toString();
    }
    class FeeDataExt extends ethers.FeeData {
      maxPriorityFeePerGasSlow;
      maxPriorityFeePerGasMedium;
      /**
       * @param gasPrice The gas price or null.
       * @param maxFeePerGas The EIP-1559 max fee per gas.
       * @param maxPriorityFeePerGas The max priority fee per gas.
       * @param maxPriorityFeePerGasSlow Optional: Lower percentile priority fee.
       * @param maxPriorityFeePerGasMedium Optional: Medium percentile priority fee.
       */
      constructor(gasPrice, maxFeePerGas, maxPriorityFeePerGas, maxPriorityFeePerGasSlow, maxPriorityFeePerGasMedium) {
        super(gasPrice, maxFeePerGas, maxPriorityFeePerGas);
        ethers.defineProperties(this, {
          gasPrice: typeof gasPrice === "bigint" ? gasPrice : null,
          maxFeePerGas: typeof maxFeePerGas === "bigint" ? maxFeePerGas : null,
          maxPriorityFeePerGas: typeof maxPriorityFeePerGas === "bigint" ? maxPriorityFeePerGas : null,
          maxPriorityFeePerGasSlow: typeof maxPriorityFeePerGasSlow === "bigint" ? maxPriorityFeePerGasSlow : null,
          maxPriorityFeePerGasMedium: typeof maxPriorityFeePerGasMedium === "bigint" ? maxPriorityFeePerGasMedium : null
        });
      }
      /**
       *  Returns a JSON-friendly value.
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toJSON() {
        return {
          _type: "FeeData",
          gasPrice: toJson(this.gasPrice),
          maxFeePerGas: toJson(this.maxFeePerGas),
          maxPriorityFeePerGas: toJson(this.maxPriorityFeePerGas),
          maxPriorityFeePerGasSlow: toJson(this.maxPriorityFeePerGasSlow),
          maxPriorityFeePerGasMedium: toJson(this.maxPriorityFeePerGasMedium)
        };
      }
    }
    class Provider extends ethers.JsonRpcProvider {
      hardhatProvider;
      staticNetwork;
      #network;
      ensResolver;
      // Fetch feeHistory
      feeHistory;
      /**
       * Multicall obj
       */
      multicall;
      multicallAllowFailure;
      // To disable multicall use multicallMaxCount: 0
      multicallMaxCount;
      multicallStallTime;
      multicallQueue;
      multicallTimer;
      /**
       * Create a new Provider.
       * @param url RPC URL or FetchRequest.
       * @param network Networkish.
       * @param options Provider options.
       */
      constructor(url, network, options) {
        const multicallStallTime = options?.multicallStallTime ?? 30;
        const batchStallTime = multicallStallTime + (options?.batchStallTime ?? 10);
        const fetchRequest = typeof url === "string" ? new ethers.FetchRequest(url) : url;
        if (fetchRequest) {
          fetchRequest.getUrlFunc = getUrlFunc(options?.fetchOptions);
        }
        super(fetchRequest, network, {
          ...options || {},
          batchStallTime
        });
        this.hardhatProvider = options?.hardhatProvider;
        this.feeHistory = options?.feeHistory ?? false;
        this.staticNetwork = (async () => {
          if (network) {
            return ethers.Network.from(network);
          }
          if (options?.hardhatProvider) {
            return ethers.Network.from(await options.hardhatProvider.getNetwork());
          }
          const _network = ethers.Network.from(await new ethers.JsonRpcProvider(fetchRequest).getNetwork());
          if (options?.chainId && BigInt(_network.chainId) !== BigInt(options.chainId)) {
            throw new Error("Wrong network");
          }
          this.#network = _network;
          return _network;
        })();
        this.ensResolver = this.staticNetwork.then(({ chainId }) => {
          const ensType = chainNames[Number(chainId)] || "ENS";
          if (options?.ensResolver) {
            return options.ensResolver;
          }
          if (ensType === "ENS") {
            return EnsResolver;
          }
          throw new Error("Unsupported ENS type");
        });
        this.multicall = Multicall__factory.connect(options?.multicall || MULTICALL_ADDRESS, this);
        this.multicallAllowFailure = options?.multicallAllowFailure ?? true;
        this.multicallMaxCount = options?.multicallMaxCount ?? 1e3;
        this.multicallStallTime = multicallStallTime;
        this.multicallQueue = [];
        this.multicallTimer = null;
      }
      /** Gets the detected or static network. */
      get _network() {
        ethers.assert(this.#network, "network is not available yet", "NETWORK_ERROR");
        return this.#network;
      }
      /** @override Resolves to the network, or throws and ensures auto-destroy on error. */
      async _detectNetwork() {
        try {
          return await this.staticNetwork;
        } catch (error) {
          if (!super.destroyed) {
            super.destroy();
          }
          throw error;
        }
      }
      /**
       * Override getFeeData func from AbstractProvider to get results as-is.
       *
       * Return fee as is from provider, it is up to populateTransaction func to compose them
       *
       * Note that in some networks (like L2), maxFeePerGas can be smaller than maxPriorityFeePerGas and if so,
       * using the value as is could throw an error from RPC as maxFeePerGas should be always bigger than maxPriorityFeePerGas
       *
       * @returns Promise resolving to FeeDataExt instance.
       */
      async getFeeData() {
        const [
          gasPrice,
          maxFeePerGas,
          maxPriorityFeePerGas,
          [maxPriorityFeePerGasMedium, maxPriorityFeePerGasSlow]
        ] = await Promise.all([
          (async () => {
            try {
              return BigInt(await this.send("eth_gasPrice", []));
            } catch {
              return 0n;
            }
          })(),
          (async () => {
            const block = await this.getBlock("latest");
            return block?.baseFeePerGas ?? null;
          })(),
          (async () => {
            try {
              return BigInt(await this.send("eth_maxPriorityFeePerGas", []));
            } catch {
              return 0n;
            }
          })(),
          (async () => {
            try {
              if (!this.feeHistory) {
                return [null, null];
              }
              const blocks = 10;
              const { priorityFeePerGasAvg } = formatFeeHistory(
                await this.send("eth_feeHistory", [blocks, "pending", [10, 25]]),
                blocks
              );
              return [priorityFeePerGasAvg[0], priorityFeePerGasAvg[1]];
            } catch {
              return [null, null];
            }
          })()
        ]);
        return new FeeDataExt(
          gasPrice,
          maxFeePerGas,
          maxPriorityFeePerGas,
          maxPriorityFeePerGasMedium,
          maxPriorityFeePerGasSlow
        );
      }
      /**
       * Returns the ENS resolver for the specified name.
       * @param name ENS name to resolve.
       * @returns Resolves to an EnsResolver or null.
       */
      async getResolver(name) {
        return (await this.ensResolver).fromName(this, name);
      }
      /**
       * Performs a reverse-lookup (address to ENS, if any).
       * @param address Address to lookup.
       * @param reverseCheck Perform confirmation roundtrip.
       * @returns ENS name or null.
       */
      async lookupAddress(address, reverseCheck) {
        return (await this.ensResolver).lookupAddress(this, address, reverseCheck);
      }
      /**
       * Waits for specified transaction (or hash) to confirm, with default timeout.
       * Does not throw on timeout.
       * @param hashOrTx TransactionResponse or hash or null.
       * @returns Null or the TransactionReceipt if confirmed.
       */
      async wait(hashOrTx) {
        try {
          if (!hashOrTx) {
            return null;
          }
          const hash = hashOrTx?.hash || hashOrTx;
          return await this.waitForTransaction(hash, 1, 60 * 1e3);
        } catch {
          return null;
        }
      }
      /**
       * Returns whether an address has code (i.e., is a contract) on-chain.
       * @param address Address to check.
       * @returns True if code exists (contract), false otherwise.
       */
      async hasCode(address) {
        const code = await this.getCode(address);
        return code && code !== "0x" ? true : false;
      }
      /**
       * Gets receipts for all transactions in a block as an array.
       * @param blockTag Block to query.
       * @returns Promise resolving to an array of TransactionReceipts.
       */
      async getBlockReceipts(blockTag) {
        return getBlockReceipts(this, blockTag, this.#network);
      }
      /**
       * Trace internal calls for a whole block.
       * @param blockTag Block to trace.
       * @param onlyTopCall If true, only trace top-level calls.
       * @returns Array of CallTrace objects for each transaction in the block.
       */
      async traceBlock(blockTag, onlyTopCall) {
        return traceBlock(this, blockTag, onlyTopCall);
      }
      /**
       * Trace internal calls for a given transaction hash.
       * @param hash Transaction hash.
       * @param onlyTopCall If true, only trace the top-level call.
       * @returns CallTrace object for the traced transaction.
       */
      async traceTransaction(hash, onlyTopCall) {
        return traceTransaction(this, hash, onlyTopCall);
      }
      /**
       * Multicaller
       */
      async _drainCalls() {
        try {
          const queue = this.multicallQueue.filter((q) => !q.called);
          queue.forEach((q) => {
            const qIndex = this.multicallQueue.findIndex((r) => r.id === q.id);
            if (qIndex > -1) {
              this.multicallQueue[qIndex].called = true;
            }
          });
          await Promise.all(
            chunk(queue, this.multicallMaxCount).map(async (_chunk, chunkIndex) => {
              await sleep(40 * chunkIndex);
              const results = await this.multicall.aggregate3.staticCall(
                _chunk.map(({ request: { to: target, data: callData } }) => ({
                  target,
                  callData,
                  allowFailure: this.multicallAllowFailure
                }))
              );
              results.forEach(([status, data], i) => {
                const queue2 = _chunk[i];
                const qIndex = this.multicallQueue.findIndex((r) => r.id === queue2?.id || 0);
                if (qIndex > -1) {
                  this.multicallQueue[qIndex].resolve({ status, data });
                  this.multicallQueue[qIndex].resolved = true;
                }
              });
            })
          );
        } catch (err) {
          this.multicallQueue.forEach((queue) => {
            queue.reject(err);
            queue.resolved = true;
          });
        }
        this.multicallQueue = this.multicallQueue.filter(({ resolved }) => !resolved);
      }
      /**
       * Queue a Multicall aggregate3 call (internal).
       * @private
       * @param to Call target address.
       * @param data Calldata.
       */
      _queueCall(to, data = "0x") {
        if (!this.multicallTimer) {
          this.multicallTimer = setTimeout(() => {
            this._drainCalls();
            this.multicallTimer = null;
          }, this.multicallStallTime);
        }
        return new Promise((resolve, reject) => {
          this.multicallQueue.push({
            id: Math.floor(Math.random() * Date.now()),
            request: { to, data },
            resolve,
            reject,
            resolved: false,
            called: false
          });
        });
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async _perform(req) {
        if (req.method === "call" && this.multicallMaxCount > 0) {
          const { from, to, value, data, blockTag } = req.transaction;
          const isAggregate3 = to === this.multicall.target && data?.startsWith("0x82ad56cb");
          if (!from && to && !value && (!blockTag || blockTag === "latest") && !isAggregate3) {
            const { status, data: result } = await this._queueCall(to, data);
            if (status) {
              return result;
            } else {
              throw ethers.AbiCoder.getBuiltinCallException("call", { to, data }, result);
            }
          }
        }
        return super._perform(req);
      }
      /**
       * For Hardhat test environments, reroutes .send() calls to the in-memory provider.
       * @override
       */
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async send(method, params) {
        if (this.hardhatProvider) {
          return this.hardhatProvider.send(method, params);
        }
        return super.send(method, params);
      }
    }

    const GAS_PRICE_ORACLE_ADDRESS = "0x420000000000000000000000000000000000000F";
    async function getL1Fee(oracle, tx) {
      const { unsignedSerialized } = ethers.Transaction.from({
        chainId: tx?.chainId || 10000n,
        data: tx?.data || "0x",
        gasLimit: tx?.gasLimit || 1e7,
        gasPrice: tx?.gasPrice || ethers.parseUnits("10000", "gwei"),
        nonce: tx?.nonce || 1e5,
        to: tx?.to instanceof Promise ? await tx?.to : tx?.to || ethers.ZeroAddress,
        type: tx?.type || 0,
        value: tx?.value || ethers.parseEther("10000")
      });
      return await oracle.getL1Fee(unsignedSerialized) * 13n / 10n;
    }

    const HARDHAT_CHAIN = 31337n;
    const ARB_CHAIN = 42161n;
    const ARB_GAS_LIMIT = 5000000n;
    const DEFAULT_GAS_LIMIT = 500000n;
    const DEFAULT_GAS_PRICE_BUMP = 2;
    const DEFAULT_GAS_LIMIT_BUMP = 1.3;
    const GAS_LIMIT_FAILOVER = 2000000n;
    async function populateTransaction(signer, tx = {}) {
      const provider = signer.appProvider || signer.provider;
      const providerHasMulticall = provider.multicall && Boolean(provider.multicallMaxCount);
      const signerAddress = signer.address || await signer.getAddress();
      const gasPriceBump = await signer.gasPriceBump?.() || DEFAULT_GAS_PRICE_BUMP;
      const gasLimitBump = await signer.gasLimitBump?.() || DEFAULT_GAS_LIMIT_BUMP;
      const customPriorityFee = await signer.customPriorityFee?.();
      if (!tx.from) {
        tx.from = signerAddress;
      } else if (tx.from !== signerAddress) {
        throw new Error("Wrong signer for transaction");
      }
      const [chainId, feeData, nonce, balance, l1Fee] = await Promise.all([
        tx.chainId ? void 0 : provider.getNetwork().then(({ chainId: chainId2 }) => chainId2),
        typeof tx.maxFeePerGas === "bigint" || typeof tx.gasPrice === "bigint" ? void 0 : provider.getFeeData(),
        typeof tx.nonce === "number" ? void 0 : provider.getTransactionCount(signerAddress, "pending"),
        typeof tx.txCost === "bigint" || !signer.autoValue || !providerHasMulticall ? void 0 : provider.multicall.getEthBalance(signerAddress),
        tx.l1Fee || !signer.opGasPriceOracle ? 0n : getL1Fee(signer.opGasPriceOracle, tx)
      ]);
      if (typeof chainId === "bigint") {
        tx.chainId = chainId;
      }
      let gasPrice = 0n;
      if (feeData) {
        if (feeData.maxFeePerGas) {
          if (!tx.type) {
            tx.type = 2;
          }
          const maxPriorityFeePerGas = typeof tx.maxPriorityFeePerGas === "bigint" ? tx.maxPriorityFeePerGas : customPriorityFee ?? (feeData.maxPriorityFeePerGas || 0n);
          const maxFeePerGas = feeData.maxFeePerGas <= maxPriorityFeePerGas ? maxPriorityFeePerGas + 10n : feeData.maxFeePerGas;
          tx.maxFeePerGas = BigInt(Math.floor(Number(maxFeePerGas) * gasPriceBump));
          tx.maxPriorityFeePerGas = maxPriorityFeePerGas;
          delete tx.gasPrice;
          gasPrice = tx.maxFeePerGas + tx.maxPriorityFeePerGas;
        } else if (typeof feeData.gasPrice === "bigint") {
          if (!tx.type && tx.type !== 0) {
            tx.type = 0;
          }
          tx.gasPrice = feeData.gasPrice;
          delete tx.maxFeePerGas;
          delete tx.maxPriorityFeePerGas;
          gasPrice = tx.gasPrice;
        }
      } else {
        gasPrice = tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) + BigInt(tx.maxPriorityFeePerGas || 0n) : BigInt(tx.gasPrice || 0n);
      }
      if (!(chainId === HARDHAT_CHAIN && signer.isHardhat) && typeof nonce === "number") {
        tx.nonce = nonce;
      }
      if (balance && BigInt(tx.value || 0) >= balance) {
        if (tx.chainId === ARB_CHAIN) {
          tx.value = balance - (gasPrice * ARB_GAS_LIMIT + l1Fee);
        } else {
          tx.value = balance - (gasPrice * DEFAULT_GAS_LIMIT + l1Fee);
        }
        const gasLimit = await provider.estimateGas(tx);
        tx.gasLimit = gasLimit !== 21000n ? BigInt(Math.floor(Number(gasLimit) * gasLimitBump)) : gasLimit;
        tx.value = balance - (gasPrice * tx.gasLimit + l1Fee);
      }
      if (!tx.gasLimit) {
        try {
          const gasLimit = await provider.estimateGas(tx);
          tx.gasLimit = gasLimit !== 21000n ? BigInt(Math.floor(Number(gasLimit) * gasLimitBump)) : gasLimit;
        } catch (error) {
          if (signer.gasLimitFailover) {
            tx.gasLimit = GAS_LIMIT_FAILOVER;
          } else {
            throw error;
          }
        }
      }
      if (l1Fee) {
        tx.l1Fee = l1Fee;
      }
      if (!tx.txCost) {
        tx.txCost = gasPrice * BigInt(tx.gasLimit) + l1Fee;
      }
      return ethers.resolveProperties(tx);
    }
    class ProxySigner {
      parentSigner;
      #wrappedProvider;
      isHardhat;
      appProvider;
      opGasPriceOracle;
      autoValue;
      gasPriceBump;
      gasLimitBump;
      customPriorityFee;
      gasLimitFailover;
      /**
       * Instantiates a ProxySigner from a parent Signer.
       * @param parentSigner The underlying Signer.
       * @param options Additional options.
       */
      constructor(parentSigner, options) {
        this.parentSigner = parentSigner;
        this.appProvider = options?.appProvider;
        this.opGasPriceOracle = options?.opGasPriceOracle ? OpGasPriceOracle__factory.connect(options.opGasPriceOracle, this.appProvider || this.provider) : void 0;
        if (options?.wrapProvider && parentSigner.provider) {
          this.#wrappedProvider = new Provider(void 0, void 0, {
            ...options?.wrapProviderOptions || {},
            hardhatProvider: parentSigner.provider
          });
          this.isHardhat = parentSigner.provider._networkName === "hardhat";
        }
        this.autoValue = options?.autoValue || false;
        this.gasPriceBump = options?.gasPriceBump;
        this.gasLimitBump = options?.gasLimitBump;
        this.customPriorityFee = options?.customPriorityFee;
        this.gasLimitFailover = options?.gasLimitFailover ?? false;
      }
      /**
       * Returns the address this signer represents.
       * @returns Address string.
       */
      get address() {
        return this.parentSigner.address;
      }
      /**
       * Provider attached to this signer (possibly a wrapped WProvider).
       * @returns Provider instance.
       */
      get provider() {
        return this.#wrappedProvider || this.parentSigner.provider;
      }
      /**
       * Creates an array of ProxySigners from an array of Signers. (like for hre.ethers.getSigners())
       * @param signers Array of SignerWithAddress.
       * @param options Optional proxy options to apply to all.
       */
      static fromSigners(signers, options) {
        return signers.map((s) => new ProxySigner(s, options));
      }
      /**
       * Returns a ProxySigner for a given address, attached to the given provider.
       * (e.g., for a read-only address).
       */
      static fromAddress(address, provider, options) {
        return new ProxySigner(new ethers.VoidSigner(address, provider), options);
      }
      /** Returns ProxySigner using a private key. */
      static fromPrivateKey(privateKey, provider, options) {
        return new ProxySigner(new ethers.Wallet(privateKey, provider), options);
      }
      /** Returns ProxySigner using a BIP-39 mnemonic phrase. */
      static fromMnemonic(mnemonic, provider, index = 0, options) {
        const defaultPath = `m/44'/60'/0'/0/${index}`;
        const { privateKey } = ethers.HDNodeWallet.fromPhrase(mnemonic, void 0, defaultPath);
        return ProxySigner.fromPrivateKey(privateKey, provider, options);
      }
      async populateTransaction(tx) {
        return await populateTransaction(this, tx);
      }
      async sendTransaction(tx) {
        const txObj = await populateTransaction(this, tx);
        const sentTx = await this.parentSigner.sendTransaction(txObj);
        if (txObj.txCost) {
          sentTx.txCost = txObj.txCost;
        }
        if (txObj.l1Fee) {
          sentTx.l1Fee = txObj.l1Fee;
        }
        return sentTx;
      }
      /**
       * For convenience with JsonRpcSigner type
       */
      async sendUncheckedTransaction(tx) {
        return this.parentSigner.sendUncheckedTransaction(
          await populateTransaction(this, tx)
        );
      }
      async unlock(password) {
        return this.provider.send("personal_unlockAccount", [
          this.address.toLowerCase(),
          password,
          null
        ]);
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      async _legacySignMessage(_message) {
        throw new Error("Unimplemented for security reasons");
      }
      /**
       * For the rest of methods proxy it
       */
      // Addressable
      getAddress() {
        return this.parentSigner.getAddress();
      }
      // Set provider
      connect(provider) {
        const connected = this.parentSigner.connect(provider);
        return new ProxySigner(connected);
      }
      // State
      getNonce(blockTag) {
        return this.parentSigner.getNonce(blockTag);
      }
      // Preparation
      populateCall(tx) {
        return this.parentSigner.populateCall(tx);
      }
      // Execution
      estimateGas(tx) {
        return this.parentSigner.estimateGas(tx);
      }
      call(tx) {
        if (this.#wrappedProvider) {
          return this.#wrappedProvider.call(tx);
        }
        return this.parentSigner.call(tx);
      }
      resolveName(name) {
        if (this.#wrappedProvider) {
          return this.#wrappedProvider.resolveName(name);
        }
        return this.parentSigner.resolveName(name);
      }
      // Signing
      signTransaction(tx) {
        return this.parentSigner.signTransaction(tx);
      }
      signMessage(message) {
        return this.parentSigner.signMessage(message);
      }
      signTypedData(domain, types, value) {
        return this.parentSigner.signTypedData(domain, types, value);
      }
      populateAuthorization(auth) {
        return this.parentSigner.populateAuthorization(auth);
      }
      authorize(authorization) {
        return this.parentSigner.authorize(authorization);
      }
    }

    async function switchChain(chainId, ethereum, params) {
      try {
        await ethereum.request({
          method: "wallet_switchEthereumChain",
          params: [{ chainId: ethers.toQuantity(chainId) }]
        });
      } catch (switchError) {
        if (switchError.code === 4902 || ethereum.isTrust) {
          await ethereum.request({
            method: "wallet_addEthereumChain",
            params: [
              {
                chainId: ethers.toQuantity(chainId),
                chainName: params?.chainName || "Ethereum",
                nativeCurrency: {
                  name: params?.chainName || "Ethereum",
                  symbol: params?.chainSymbol || "ETH",
                  decimals: 18
                },
                rpcUrls: params?.rpcUrl ? [params.rpcUrl] : [],
                blockExplorerUrls: [params?.explorerUrl || "https://etherscan.io"]
              }
            ]
          });
        } else {
          throw switchError;
        }
      }
    }
    class BrowserProvider extends ethers.BrowserProvider {
      ethereum;
      appProvider;
      options;
      chainChanged;
      accountsChanged;
      disconnect;
      /**
       * Create a new BrowserProvider instance.
       * @param ethereum The injected EIP-1193 provider.
       * @param appProvider Optional fallback/provider for network context.
       * @param options Additional options.
       */
      constructor(ethereum, appProvider, options) {
        super(ethereum, appProvider?._network, options);
        this.ethereum = ethereum;
        this.appProvider = appProvider;
        this.options = options;
        this.chainChanged = options?.chainChanged;
        this.accountsChanged = options?.accountsChanged;
        this.disconnect = options?.disconnect;
      }
      /**
       * Returns a ProxySigner-wrapped JsonRpcSigner for the given address.
       * Handles chain switching automatically if required.
       * @param address Signer address to retrieve.
       * @returns Promise resolving to JsonRpcSigner instance.
       */
      async getSigner(address) {
        const [{ address: signerAddress }, signerChainId] = await Promise.all([
          super.getSigner(address),
          super.send("eth_chainId", []).then((c) => BigInt(c))
        ]);
        const appChainId = this.appProvider?._network.chainId;
        if (appChainId && signerChainId !== appChainId) {
          await switchChain(appChainId, this.ethereum, this.options);
        }
        if (this.chainChanged) {
          this.ethereum.on("chainChanged", this.chainChanged);
        }
        if (this.accountsChanged) {
          this.ethereum.on("accountsChanged", this.accountsChanged);
        }
        if (this.disconnect) {
          this.ethereum.on("disconnect", this.disconnect);
        }
        return new ProxySigner(new ethers.JsonRpcSigner(this, signerAddress), {
          ...this.options,
          appProvider: this.options?.appProvider || this.appProvider
        });
      }
      /**
       * Supports EIP-6963 discovery for browser wallet providers; returns matching BrowserProviders.
       * https://github.com/ethers-io/ethers.js/commit/f5469dd0e0719389d51e0106ee36d07a7ebef875
       * @param appProvider Optional backend provider.
       * @param options Optional options.
       * @returns Promise resolving to an array of detected BrowserProvider instances.
       */
      static discoverProviders(appProvider, options) {
        return new Promise((resolve) => {
          const found = [];
          const listener = (event) => {
            found.push(event.detail);
          };
          setTimeout(() => {
            const providers = found.map(({ info: providerInfo, provider }) => {
              return new BrowserProvider(provider, appProvider, {
                ...options,
                providerInfo
              });
            });
            window?.removeEventListener("eip6963:announceProvider", listener);
            resolve(providers);
          }, 300);
          window?.addEventListener("eip6963:announceProvider", listener);
          window?.dispatchEvent(new Event("eip6963:requestProvider"));
        });
      }
    }

    async function permit(erc20, spender, value = ethers.MaxUint256, deadline = ethers.MaxUint256) {
      const token = erc20;
      const spenderAddress = spender?.target || spender;
      const signer = token.runner;
      const [name, nonce, { chainId }] = await Promise.all([
        token.name(),
        token.nonces(signer.address),
        signer.provider.getNetwork()
      ]);
      return ethers.Signature.from(
        await signer.signTypedData(
          {
            name,
            version: "1",
            chainId,
            verifyingContract: token.target
          },
          {
            Permit: [
              { name: "owner", type: "address" },
              { name: "spender", type: "address" },
              { name: "value", type: "uint256" },
              { name: "nonce", type: "uint256" },
              { name: "deadline", type: "uint256" }
            ]
          },
          {
            owner: signer.address,
            spender: spenderAddress,
            value,
            nonce,
            deadline
          }
        )
      );
    }

    const OFFCHAIN_ORACLE_ADDRESS = "0x00000000000D6FFc74A8feb35aF5827bf57f6786";
    async function getRateToEth(oracle, erc20) {
      const token = erc20;
      const [decimals, price] = await Promise.all([token.decimals(), oracle.getRateToEth(token.target, true)]);
      return price * 10n ** decimals / 10n ** 18n;
    }
    const PHASE_OFFSET = 64;
    function getAggregatorRoundId(roundId) {
      return Number(BigInt(roundId) & (BigInt(1) << BigInt(PHASE_OFFSET)) - BigInt(1));
    }
    async function getChainlink(provider, symbolOrAddress, quoteSymbol = "usd") {
      const isSymbol = !symbolOrAddress.startsWith("0x");
      let chainlinkAddress = symbolOrAddress;
      if (isSymbol) {
        const chainlinkSymbol = (symbolOrAddress.startsWith("W") ? symbolOrAddress.replace("W", "") : symbolOrAddress).toLowerCase();
        const chainlinkEns = `${chainlinkSymbol}-${quoteSymbol}.data.eth`;
        const resolvedAddress = await provider.resolveName(chainlinkEns);
        if (!resolvedAddress) {
          throw new Error(`Unknown address for ${chainlinkEns}`);
        }
        chainlinkAddress = resolvedAddress;
      }
      return DataFeed__factory.connect(chainlinkAddress, provider);
    }
    async function getChainlinkPrice(provider, symbolOrAddress, quoteSymbol) {
      const dataFeed = await getChainlink(provider, symbolOrAddress, quoteSymbol);
      const [latestAnswer, decimals] = await Promise.all([
        dataFeed.latestAnswer(),
        dataFeed.decimals().then((d) => Number(d))
      ]);
      return Number(ethers.formatUnits(latestAnswer, decimals));
    }

    const IDB_ERR = "A mutation operation was attempted on a database that did not allow mutations.";
    class IndexedDB {
      name;
      version;
      options;
      db;
      constructor({ name, version = 1, stores = [] }) {
        this.name = name;
        this.version = version;
        if (stores.findIndex(({ name: name2 }) => name2 === "keyStore") === -1) {
          stores.push({ name: "keyStore" });
        }
        this.options = {
          upgrade(db) {
            Object.values(db.objectStoreNames).forEach((value) => {
              db.deleteObjectStore(value);
            });
            stores.forEach(({ name: name2, keyPath, indexes }) => {
              const store = db.createObjectStore(name2, {
                keyPath,
                autoIncrement: true
              });
              if (Array.isArray(indexes)) {
                indexes.forEach(({ name: name3, unique = false }) => {
                  store.createIndex(name3, name3, { unique });
                });
              }
            });
          }
        };
        this.db = this.openDB();
      }
      async openDB() {
        try {
          if (!window?.idb) {
            console.log("IDB library is not available!");
            return;
          }
          const db = await window.idb.openDB(this.name, this.version, this.options);
          db.addEventListener("onupgradeneeded", async () => {
            await this.deleteDB();
          });
          return db;
        } catch (err) {
          if (err.message.includes(IDB_ERR)) {
            console.log("The browser does not support IndexedDB");
            return;
          }
          if (err.message.includes("less than the existing version")) {
            console.log(`Upgrading DB ${this.name} to ${this.version}`);
            await this.deleteDB();
            return;
          }
          console.log(`openDB error: ${err.message}`);
        }
      }
      async deleteDB() {
        await window?.idb?.deleteDB(this.name);
        this.db = this.openDB();
        await this.db;
      }
      async getItem({ storeName, key }) {
        try {
          const db = await this.db;
          if (!db) {
            return;
          }
          const store = db.transaction(storeName).objectStore(storeName);
          return await store.get(key);
        } catch (err) {
          throw new Error(`getItem error: ${err.message}`);
        }
      }
      /**
       * Add item only if key is new
       */
      async addItem({ storeName, key, data }) {
        try {
          const db = await this.db;
          if (!db) {
            return;
          }
          const tx = db.transaction(storeName, "readwrite");
          const isExist = await tx.objectStore(storeName).get(key);
          if (!isExist) {
            await tx.objectStore(storeName).add(data);
          }
        } catch (err) {
          throw new Error(`addItem error: ${err.message}`);
        }
      }
      /**
       * Override item for key
       */
      async putItem({
        storeName,
        key = "",
        data
      }) {
        try {
          const db = await this.db;
          if (!db) {
            return;
          }
          const tx = db.transaction(storeName, "readwrite");
          await tx.objectStore(storeName).put(data, key);
        } catch (err) {
          throw new Error(`putItem error: ${err.message}`);
        }
      }
      async deleteItem({ storeName, key }) {
        try {
          const db = await this.db;
          if (!db) {
            return;
          }
          const tx = db.transaction(storeName, "readwrite");
          await tx.objectStore(storeName).delete(key);
        } catch (err) {
          throw new Error(`putItem error: ${err.message}`);
        }
      }
      async getAll({ storeName }) {
        try {
          const db = await this.db;
          if (!db) {
            return [];
          }
          const tx = db.transaction(storeName, "readonly");
          return await tx.objectStore(storeName).getAll();
        } catch (err) {
          throw new Error(`getAll error: ${err.message}`);
        }
      }
      async clearStore({ storeName }) {
        try {
          const db = await this.db;
          if (!db) {
            return;
          }
          const tx = db.transaction(storeName, "readwrite");
          await tx.objectStore(storeName).clear();
        } catch (err) {
          throw new Error(`clearStore error: ${err.message}`);
        }
      }
      async createTransactions({ storeName, data }) {
        try {
          const db = await this.db;
          if (!db) {
            return;
          }
          const tx = db.transaction(storeName, "readwrite");
          await tx.objectStore(storeName).add(data);
          await tx.done;
        } catch (err) {
          throw new Error(`Method createTransactions has error: ${err.message}`);
        }
      }
      async createMultipleTransactions({
        storeName,
        data,
        index
      }) {
        try {
          const db = await this.db;
          if (!db) {
            return;
          }
          const tx = db.transaction(storeName, "readwrite");
          for (const item of data) {
            if (item) {
              await tx.store.put({ ...item, ...index });
            }
          }
        } catch (err) {
          throw new Error(`Method createMultipleTransactions has error: ${err.message}`);
        }
      }
      /**
       * Key-Value
       */
      get(key) {
        return this.getItem({ storeName: "keyStore", key });
      }
      set(key, data) {
        return this.putItem({ storeName: "keyStore", key, data });
      }
      del(key) {
        return this.deleteItem({ storeName: "keyStore", key });
      }
    }

    exports.ARB_CHAIN = ARB_CHAIN;
    exports.ARB_GAS_LIMIT = ARB_GAS_LIMIT;
    exports.BrowserProvider = BrowserProvider;
    exports.CreateX__factory = CreateX__factory;
    exports.DEFAULT_GAS_LIMIT = DEFAULT_GAS_LIMIT;
    exports.DEFAULT_GAS_LIMIT_BUMP = DEFAULT_GAS_LIMIT_BUMP;
    exports.DEFAULT_GAS_PRICE_BUMP = DEFAULT_GAS_PRICE_BUMP;
    exports.DataFeed__factory = DataFeed__factory;
    exports.ERC20__factory = ERC20__factory;
    exports.EnsResolver = EnsResolver;
    exports.EthersBatcher = EthersBatcher;
    exports.FeeDataExt = FeeDataExt;
    exports.GAS_LIMIT_FAILOVER = GAS_LIMIT_FAILOVER;
    exports.GAS_PRICE_ORACLE_ADDRESS = GAS_PRICE_ORACLE_ADDRESS;
    exports.HARDHAT_CHAIN = HARDHAT_CHAIN;
    exports.IndexedDB = IndexedDB;
    exports.MULTICALL_ADDRESS = MULTICALL_ADDRESS;
    exports.Multicall__factory = Multicall__factory;
    exports.OFFCHAIN_ORACLE_ADDRESS = OFFCHAIN_ORACLE_ADDRESS;
    exports.OffchainOracle__factory = OffchainOracle__factory;
    exports.OpGasPriceOracle__factory = OpGasPriceOracle__factory;
    exports.PHASE_OFFSET = PHASE_OFFSET;
    exports.Permit2__factory = Permit2__factory;
    exports.Provider = Provider;
    exports.ProxySigner = ProxySigner;
    exports.WETH__factory = WETH__factory;
    exports.base64ToBytes = base64ToBytes;
    exports.base64ToHex = base64ToHex;
    exports.bufferToBytes = bufferToBytes;
    exports.bytesToBase64 = bytesToBase64;
    exports.bytesToHex = bytesToHex;
    exports.chainNames = chainNames;
    exports.chunk = chunk;
    exports.compareBlockHashes = compareBlockHashes;
    exports.concatBytes = concatBytes;
    exports.createBatchRateConfig = createBatchRateConfig;
    exports.createBatchRequest = createBatchRequest;
    exports.createBlockTags = createBlockTags;
    exports.crypto = crypto;
    exports.digest = digest;
    exports.digestHex = digestHex;
    exports.ensRegistries = ensRegistries;
    exports.ensReverseNode = ensReverseNode;
    exports.ensStaticResolvers = ensStaticResolvers;
    exports.ensUniversalResolvers = ensUniversalResolvers;
    exports.factories = index;
    exports.fetchBlockHashes = fetchBlockHashes;
    exports.formatCallTrace = formatCallTrace;
    exports.formatFeeHistory = formatFeeHistory;
    exports.getAggregatorRoundId = getAggregatorRoundId;
    exports.getBlockReceipts = getBlockReceipts;
    exports.getChainlink = getChainlink;
    exports.getChainlinkPrice = getChainlinkPrice;
    exports.getGasPrice = getGasPrice;
    exports.getL1Fee = getL1Fee;
    exports.getProof = getProof;
    exports.getRateToEth = getRateToEth;
    exports.getStorageAt = getStorageAt;
    exports.getSubInfo = getSubInfo;
    exports.hexToBase64 = hexToBase64;
    exports.hexToBytes = hexToBytes;
    exports.isDeferred = isDeferred;
    exports.isHex = isHex;
    exports.isNode = isNode;
    exports.multiQueryFilter = multiQueryFilter;
    exports.multicall = multicall;
    exports.permit = permit;
    exports.populateTransaction = populateTransaction;
    exports.rBytes = rBytes;
    exports.range = range;
    exports.sleep = sleep;
    exports.switchChain = switchChain;
    exports.toEvenHex = toEvenHex;
    exports.toFixedHex = toFixedHex;
    exports.traceBlock = traceBlock;
    exports.traceTransaction = traceTransaction;
    exports.wildcardResolvers = wildcardResolvers;

}));
