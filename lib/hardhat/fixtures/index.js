import hre from 'hardhat';
import { EnsResolver as EnsResolver$1, Contract, namehash, ZeroAddress, getAddress, dnsEncode, isError, Interface, assert, JsonRpcProvider, FetchRequest, Network, AbiCoder, FeeData, defineProperties, Transaction, parseEther, parseUnits, VoidSigner, Wallet, HDNodeWallet, resolveProperties, ContractFactory, formatEther } from 'ethers';
import 'crypto';
import { access, constants, stat } from 'fs/promises';

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

class EnsResolver extends EnsResolver$1 {
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
      const contract = new Contract(
        ensAddr,
        ["function resolver(bytes32) view returns (address)"],
        provider
      );
      const addr = await contract.resolver(hash || namehash(name || ""), {
        enableCcipRead: true
      });
      if (addr === ZeroAddress) {
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
      address = getAddress(address);
      const chainId = Number((await provider.getNetwork()).chainId);
      const reverseName = address.substring(2).toLowerCase() + (ensReverseNode[chainId] || ".addr.reverse");
      const node = namehash(reverseName);
      const resolverAddress = await EnsResolver.#getResolver(provider, "", node);
      if (resolverAddress == null || resolverAddress === ZeroAddress) {
        return null;
      }
      const resolverContract = new Contract(
        resolverAddress,
        [
          "function reverse(bytes) view returns (string memory, address, address, address)",
          "function name(bytes32) view returns (string)"
        ],
        provider
      );
      if (ensUniversalResolvers[chainId]) {
        const dnsNode = dnsEncode(reverseName);
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
      if (isError(error, "BAD_DATA") && error.value === "0x") {
        return null;
      }
      if (isError(error, "CALL_EXCEPTION")) {
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
      if (isError(error, "BAD_DATA") && error.value === "0x") {
        return null;
      }
      throw error;
    }
  }
  async getText(key) {
    try {
      return await super.getText(key);
    } catch (error) {
      if (isError(error, "BAD_DATA") && error.value === "0x") {
        return null;
      }
      throw error;
    }
  }
  async getContentHash() {
    try {
      return await super.getContentHash();
    } catch (error) {
      if (isError(error, "BAD_DATA") && error.value === "0x") {
        return null;
      }
      throw error;
    }
  }
  async getAvatar() {
    try {
      return await super.getAvatar();
    } catch (error) {
      if (isError(error, "BAD_DATA") && error.value === "0x") {
        return null;
      }
      throw error;
    }
  }
}

const _abi$3 = [
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
  static abi = _abi$3;
  static createInterface() {
    return new Interface(_abi$3);
  }
  static connect(address, runner) {
    return new Contract(address, _abi$3, runner);
  }
}

const _abi$2 = [
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
  static abi = _abi$2;
  static createInterface() {
    return new Interface(_abi$2);
  }
  static connect(address, runner) {
    return new Contract(address, _abi$2, runner);
  }
}

const _abi$1 = [
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
  static abi = _abi$1;
  static createInterface() {
    return new Interface(_abi$1);
  }
  static connect(address, runner) {
    return new Contract(address, _abi$1, runner);
  }
}

if (!BigInt.prototype.toJSON) {
  BigInt.prototype.toJSON = function() {
    return this.toString();
  };
}
!process?.browser && typeof globalThis.window === "undefined";
function chunk(arr, size) {
  return [...Array(Math.ceil(arr.length / size))].map((_, i) => arr.slice(size * i, size + size * i));
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
    from: params.from ? getAddress(params.from) : "",
    gas: Number(params.gas || 0),
    gasUsed: Number(params.gasUsed || 0),
    to: params.to ? getAddress(params.to) : "",
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
    provider.getTransaction(hash),
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

const MULTICALL_ADDRESS = "0xcA11bde05977b3631167028862bE2a173976CA11";

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
          assert(
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
class FeeDataExt extends FeeData {
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
    defineProperties(this, {
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
class Provider extends JsonRpcProvider {
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
    const fetchRequest = typeof url === "string" ? new FetchRequest(url) : url;
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
        return Network.from(network);
      }
      if (options?.hardhatProvider) {
        return Network.from(await options.hardhatProvider.getNetwork());
      }
      const _network = Network.from(await new JsonRpcProvider(fetchRequest).getNetwork());
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
    assert(this.#network, "network is not available yet", "NETWORK_ERROR");
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
      const results = (await Promise.all(
        chunk(this.multicallQueue, this.multicallMaxCount).map(async (_chunk, chunkIndex) => {
          await sleep(40 * chunkIndex);
          return await this.multicall.aggregate3.staticCall(
            _chunk.map(({ request: { to: target, data: callData } }) => ({
              target,
              callData,
              allowFailure: this.multicallAllowFailure
            }))
          );
        })
      )).flat();
      results.forEach(([status, data], i) => {
        this.multicallQueue[i].resolve({ status, data });
        this.multicallQueue[i].resolved = true;
      });
    } catch (err) {
      this.multicallQueue.forEach((queue) => {
        queue.reject(err);
        queue.resolved = true;
      });
    }
    this.multicallQueue = this.multicallQueue.filter(({ resolved }) => !resolved);
    if (this.multicallQueue.length) {
      this._drainCalls();
    } else {
      this.multicallTimer = null;
    }
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
      }, this.multicallStallTime);
    }
    return new Promise((resolve, reject) => {
      this.multicallQueue.push({ request: { to, data }, resolve, reject, resolved: false });
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
          throw AbiCoder.getBuiltinCallException("call", { to, data }, result);
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

async function getL1Fee(oracle, tx) {
  const { unsignedSerialized } = Transaction.from({
    chainId: tx?.chainId || 10000n,
    data: tx?.data || "0x",
    gasLimit: tx?.gasLimit || 1e7,
    gasPrice: tx?.gasPrice || parseUnits("10000", "gwei"),
    nonce: tx?.nonce || 1e5,
    to: tx?.to instanceof Promise ? await tx?.to : tx?.to || ZeroAddress,
    type: tx?.type || 0,
    value: tx?.value || parseEther("10000")
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
  return resolveProperties(tx);
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
    return new ProxySigner(new VoidSigner(address, provider), options);
  }
  /** Returns ProxySigner using a private key. */
  static fromPrivateKey(privateKey, provider, options) {
    return new ProxySigner(new Wallet(privateKey, provider), options);
  }
  /** Returns ProxySigner using a BIP-39 mnemonic phrase. */
  static fromMnemonic(mnemonic, provider, index = 0, options) {
    const defaultPath = `m/44'/60'/0'/0/${index}`;
    const { privateKey } = HDNodeWallet.fromPhrase(mnemonic, void 0, defaultPath);
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

const _abi = [
  {
    inputs: [
      {
        internalType: "string",
        name: "name_",
        type: "string"
      },
      {
        internalType: "string",
        name: "symbol_",
        type: "string"
      },
      {
        internalType: "uint8",
        name: "decimals_",
        type: "uint8"
      },
      {
        internalType: "uint256",
        name: "supply_",
        type: "uint256"
      }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "ECDSAInvalidSignature",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "length",
        type: "uint256"
      }
    ],
    name: "ECDSAInvalidSignatureLength",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "bytes32",
        name: "s",
        type: "bytes32"
      }
    ],
    name: "ECDSAInvalidSignatureS",
    type: "error"
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
        name: "allowance",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256"
      }
    ],
    name: "ERC20InsufficientAllowance",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "balance",
        type: "uint256"
      },
      {
        internalType: "uint256",
        name: "needed",
        type: "uint256"
      }
    ],
    name: "ERC20InsufficientBalance",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "approver",
        type: "address"
      }
    ],
    name: "ERC20InvalidApprover",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "receiver",
        type: "address"
      }
    ],
    name: "ERC20InvalidReceiver",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address"
      }
    ],
    name: "ERC20InvalidSender",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address"
      }
    ],
    name: "ERC20InvalidSpender",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "deadline",
        type: "uint256"
      }
    ],
    name: "ERC2612ExpiredSignature",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "signer",
        type: "address"
      },
      {
        internalType: "address",
        name: "owner",
        type: "address"
      }
    ],
    name: "ERC2612InvalidSigner",
    type: "error"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "currentNonce",
        type: "uint256"
      }
    ],
    name: "InvalidAccountNonce",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidShortString",
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
    inputs: [
      {
        internalType: "string",
        name: "str",
        type: "string"
      }
    ],
    name: "StringTooLong",
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
    inputs: [],
    name: "EIP712DomainChanged",
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
    inputs: [
      {
        internalType: "uint256",
        name: "value",
        type: "uint256"
      }
    ],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address"
      },
      {
        internalType: "uint256",
        name: "value",
        type: "uint256"
      }
    ],
    name: "burnFrom",
    outputs: [],
    stateMutability: "nonpayable",
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
    name: "eip712Domain",
    outputs: [
      {
        internalType: "bytes1",
        name: "fields",
        type: "bytes1"
      },
      {
        internalType: "string",
        name: "name",
        type: "string"
      },
      {
        internalType: "string",
        name: "version",
        type: "string"
      },
      {
        internalType: "uint256",
        name: "chainId",
        type: "uint256"
      },
      {
        internalType: "address",
        name: "verifyingContract",
        type: "address"
      },
      {
        internalType: "bytes32",
        name: "salt",
        type: "bytes32"
      },
      {
        internalType: "uint256[]",
        name: "extensions",
        type: "uint256[]"
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
        name: "amount",
        type: "uint256"
      }
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256"
      }
    ],
    name: "mint",
    outputs: [],
    stateMutability: "nonpayable",
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
    name: "renounceOwnership",
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
const _bytecode = "0x61018060405234801561001157600080fd5b506040516118a63803806118a68339810160408190526100309161045f565b338480604051806040016040528060018152602001603160f81b8152508787816003908161005e9190610571565b50600461006b8282610571565b5061007b91508390506005610175565b6101205261008a816006610175565b61014052815160208084019190912060e052815190820120610100524660a05261011760e05161010051604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201529081019290925260608201524660808201523060a082015260009060c00160405160208183030381529060405280519060200120905090565b60805250503060c052506001600160a01b03811661015057604051631e4fbdf760e01b8152600060048201526024015b60405180910390fd5b610159816101a8565b5060ff82166101605261016c33826101fa565b505050506106a7565b60006020835110156101915761018a83610234565b90506101a2565b8161019c8482610571565b5060ff90505b92915050565b600880546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b6001600160a01b0382166102245760405163ec442f0560e01b815260006004820152602401610147565b61023060008383610272565b5050565b600080829050601f8151111561025f578260405163305a27a960e01b8152600401610147919061062f565b805161026a82610662565b179392505050565b6001600160a01b03831661029d5780600260008282546102929190610686565b9091555061030f9050565b6001600160a01b038316600090815260208190526040902054818110156102f05760405163391434e360e21b81526001600160a01b03851660048201526024810182905260448101839052606401610147565b6001600160a01b03841660009081526020819052604090209082900390555b6001600160a01b03821661032b5760028054829003905561034a565b6001600160a01b03821660009081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161038f91815260200190565b60405180910390a3505050565b634e487b7160e01b600052604160045260246000fd5b60005b838110156103cd5781810151838201526020016103b5565b50506000910152565b600082601f8301126103e757600080fd5b81516001600160401b038111156104005761040061039c565b604051601f8201601f19908116603f011681016001600160401b038111828210171561042e5761042e61039c565b60405281815283820160200185101561044657600080fd5b6104578260208301602087016103b2565b949350505050565b6000806000806080858703121561047557600080fd5b84516001600160401b0381111561048b57600080fd5b610497878288016103d6565b602087015190955090506001600160401b038111156104b557600080fd5b6104c1878288016103d6565b935050604085015160ff811681146104d857600080fd5b6060959095015193969295505050565b600181811c908216806104fc57607f821691505b60208210810361051c57634e487b7160e01b600052602260045260246000fd5b50919050565b601f82111561056c57806000526020600020601f840160051c810160208510156105495750805b601f840160051c820191505b818110156105695760008155600101610555565b50505b505050565b81516001600160401b0381111561058a5761058a61039c565b61059e8161059884546104e8565b84610522565b6020601f8211600181146105d257600083156105ba5750848201515b600019600385901b1c1916600184901b178455610569565b600084815260208120601f198516915b8281101561060257878501518255602094850194600190920191016105e2565b50848210156106205786840151600019600387901b60f8161c191681555b50505050600190811b01905550565b602081526000825180602084015261064e8160408501602087016103b2565b601f01601f19169190910160400192915050565b8051602080830151919081101561051c5760001960209190910360031b1b16919050565b808201808211156101a257634e487b7160e01b600052601160045260246000fd5b60805160a05160c05160e0516101005161012051610140516101605161119a61070c600039600061019e015260006109840152600061095701526000610814015260006107ec01526000610747015260006107710152600061079b015261119a6000f3fe608060405234801561001057600080fd5b506004361061012c5760003560e01c806379cc6790116100ad578063a0712d6811610071578063a0712d681461028d578063a9059cbb146102a0578063d505accf146102b3578063dd62ed3e146102c6578063f2fde38b146102ff57600080fd5b806379cc6790146102295780637ecebe001461023c57806384b0196e1461024f5780638da5cb5b1461026a57806395d89b411461028557600080fd5b80633644e515116100f45780633644e515146101c857806340c10f19146101d057806342966c68146101e557806370a08231146101f8578063715018a61461022157600080fd5b806306fdde0314610131578063095ea7b31461014f57806318160ddd1461017257806323b872dd14610184578063313ce56714610197575b600080fd5b610139610312565b6040516101469190610ee4565b60405180910390f35b61016261015d366004610f1a565b6103a4565b6040519015158152602001610146565b6002545b604051908152602001610146565b610162610192366004610f44565b6103be565b60405160ff7f0000000000000000000000000000000000000000000000000000000000000000168152602001610146565b6101766103e2565b6101e36101de366004610f1a565b6103f1565b005b6101e36101f3366004610f81565b610407565b610176610206366004610f9a565b6001600160a01b031660009081526020819052604090205490565b6101e3610414565b6101e3610237366004610f1a565b610428565b61017661024a366004610f9a565b61043d565b61025761045b565b6040516101469796959493929190610fb5565b6008546040516001600160a01b039091168152602001610146565b6101396104a1565b6101e361029b366004610f81565b6104b0565b6101626102ae366004610f1a565b6104c2565b6101e36102c136600461104d565b6104d0565b6101766102d43660046110c0565b6001600160a01b03918216600090815260016020908152604080832093909416825291909152205490565b6101e361030d366004610f9a565b61060f565b606060038054610321906110f3565b80601f016020809104026020016040519081016040528092919081815260200182805461034d906110f3565b801561039a5780601f1061036f5761010080835404028352916020019161039a565b820191906000526020600020905b81548152906001019060200180831161037d57829003601f168201915b5050505050905090565b6000336103b281858561064a565b60019150505b92915050565b6000336103cc85828561065c565b6103d78585856106db565b506001949350505050565b60006103ec61073a565b905090565b6103f9610865565b6104038282610892565b5050565b61041133826108c8565b50565b61041c610865565b61042660006108fe565b565b61043382338361065c565b61040382826108c8565b6001600160a01b0381166000908152600760205260408120546103b8565b60006060806000806000606061046f610950565b61047761097d565b60408051600080825260208201909252600f60f81b9b939a50919850469750309650945092509050565b606060048054610321906110f3565b6104b8610865565b6104113382610892565b6000336103b28185856106db565b834211156104f95760405163313c898160e11b8152600481018590526024015b60405180910390fd5b60007f6e71edae12b1b97f4d1f60370fef10105fa2faae0126114a169c64845d6126c98888886105468c6001600160a01b0316600090815260076020526040902080546001810190915590565b6040805160208101969096526001600160a01b0394851690860152929091166060840152608083015260a082015260c0810186905260e00160405160208183030381529060405280519060200120905060006105a1826109aa565b905060006105b1828787876109d7565b9050896001600160a01b0316816001600160a01b0316146105f8576040516325c0072360e11b81526001600160a01b0380831660048301528b1660248201526044016104f0565b6106038a8a8a61064a565b50505050505050505050565b610617610865565b6001600160a01b03811661064157604051631e4fbdf760e01b8152600060048201526024016104f0565b610411816108fe565b6106578383836001610a05565b505050565b6001600160a01b038381166000908152600160209081526040808320938616835292905220546000198110156106d557818110156106c657604051637dc7a0d960e11b81526001600160a01b038416600482015260248101829052604481018390526064016104f0565b6106d584848484036000610a05565b50505050565b6001600160a01b03831661070557604051634b637e8f60e11b8152600060048201526024016104f0565b6001600160a01b03821661072f5760405163ec442f0560e01b8152600060048201526024016104f0565b610657838383610ada565b6000306001600160a01b037f00000000000000000000000000000000000000000000000000000000000000001614801561079357507f000000000000000000000000000000000000000000000000000000000000000046145b156107bd57507f000000000000000000000000000000000000000000000000000000000000000090565b6103ec604080517f8b73c3c69bb8fe3d512ecc4cf759cc79239f7b179b0ffacaa9a75d522b39400f60208201527f0000000000000000000000000000000000000000000000000000000000000000918101919091527f000000000000000000000000000000000000000000000000000000000000000060608201524660808201523060a082015260009060c00160405160208183030381529060405280519060200120905090565b6008546001600160a01b031633146104265760405163118cdaa760e01b81523360048201526024016104f0565b6001600160a01b0382166108bc5760405163ec442f0560e01b8152600060048201526024016104f0565b61040360008383610ada565b6001600160a01b0382166108f257604051634b637e8f60e11b8152600060048201526024016104f0565b61040382600083610ada565b600880546001600160a01b038381166001600160a01b0319831681179093556040519116919082907f8be0079c531659141344cd1fd0a4f28419497f9722a3daafe3b4186f6b6457e090600090a35050565b60606103ec7f00000000000000000000000000000000000000000000000000000000000000006005610c04565b60606103ec7f00000000000000000000000000000000000000000000000000000000000000006006610c04565b60006103b86109b761073a565b8360405161190160f01b8152600281019290925260228201526042902090565b6000806000806109e988888888610caf565b9250925092506109f98282610d7e565b50909695505050505050565b6001600160a01b038416610a2f5760405163e602df0560e01b8152600060048201526024016104f0565b6001600160a01b038316610a5957604051634a1406b160e11b8152600060048201526024016104f0565b6001600160a01b03808516600090815260016020908152604080832093871683529290522082905580156106d557826001600160a01b0316846001600160a01b03167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b92584604051610acc91815260200190565b60405180910390a350505050565b6001600160a01b038316610b05578060026000828254610afa919061112d565b90915550610b779050565b6001600160a01b03831660009081526020819052604090205481811015610b585760405163391434e360e21b81526001600160a01b038516600482015260248101829052604481018390526064016104f0565b6001600160a01b03841660009081526020819052604090209082900390555b6001600160a01b038216610b9357600280548290039055610bb2565b6001600160a01b03821660009081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051610bf791815260200190565b60405180910390a3505050565b606060ff8314610c1e57610c1783610e37565b90506103b8565b818054610c2a906110f3565b80601f0160208091040260200160405190810160405280929190818152602001828054610c56906110f3565b8015610ca35780601f10610c7857610100808354040283529160200191610ca3565b820191906000526020600020905b815481529060010190602001808311610c8657829003601f168201915b505050505090506103b8565b600080807f7fffffffffffffffffffffffffffffff5d576e7357a4501ddfe92f46681b20a0841115610cea5750600091506003905082610d74565b604080516000808252602082018084528a905260ff891692820192909252606081018790526080810186905260019060a0016020604051602081039080840390855afa158015610d3e573d6000803e3d6000fd5b5050604051601f1901519150506001600160a01b038116610d6a57506000925060019150829050610d74565b9250600091508190505b9450945094915050565b6000826003811115610d9257610d9261114e565b03610d9b575050565b6001826003811115610daf57610daf61114e565b03610dcd5760405163f645eedf60e01b815260040160405180910390fd5b6002826003811115610de157610de161114e565b03610e025760405163fce698f760e01b8152600481018290526024016104f0565b6003826003811115610e1657610e1661114e565b03610403576040516335e2f38360e21b8152600481018290526024016104f0565b60606000610e4483610e76565b604080516020808252818301909252919250600091906020820181803683375050509182525060208101929092525090565b600060ff8216601f8111156103b857604051632cd44ac360e21b815260040160405180910390fd5b6000815180845260005b81811015610ec457602081850181015186830182015201610ea8565b506000602082860101526020601f19601f83011685010191505092915050565b602081526000610ef76020830184610e9e565b9392505050565b80356001600160a01b0381168114610f1557600080fd5b919050565b60008060408385031215610f2d57600080fd5b610f3683610efe565b946020939093013593505050565b600080600060608486031215610f5957600080fd5b610f6284610efe565b9250610f7060208501610efe565b929592945050506040919091013590565b600060208284031215610f9357600080fd5b5035919050565b600060208284031215610fac57600080fd5b610ef782610efe565b60ff60f81b8816815260e060208201526000610fd460e0830189610e9e565b8281036040840152610fe68189610e9e565b606084018890526001600160a01b038716608085015260a0840186905283810360c08501528451808252602080870193509091019060005b8181101561103c57835183526020938401939092019160010161101e565b50909b9a5050505050505050505050565b600080600080600080600060e0888a03121561106857600080fd5b61107188610efe565b965061107f60208901610efe565b95506040880135945060608801359350608088013560ff811681146110a357600080fd5b9699959850939692959460a0840135945060c09093013592915050565b600080604083850312156110d357600080fd5b6110dc83610efe565b91506110ea60208401610efe565b90509250929050565b600181811c9082168061110757607f821691505b60208210810361112757634e487b7160e01b600052602260045260246000fd5b50919050565b808201808211156103b857634e487b7160e01b600052601160045260246000fd5b634e487b7160e01b600052602160045260246000fdfea264697066735822122075bbb826a2c65d321c097e5e973befa198a479e12f18233b5319873ca2101d1a64736f6c634300081e0033";
const isSuperArgs = (xs) => xs.length > 1;
class ERC20Mock__factory extends ContractFactory {
  constructor(...args) {
    if (isSuperArgs(args)) {
      super(...args);
    } else {
      super(_abi, _bytecode, args[0]);
    }
  }
  getDeployTransaction(name_, symbol_, decimals_, supply_, overrides) {
    return super.getDeployTransaction(
      name_,
      symbol_,
      decimals_,
      supply_,
      overrides || {}
    );
  }
  deploy(name_, symbol_, decimals_, supply_, overrides) {
    return super.deploy(
      name_,
      symbol_,
      decimals_,
      supply_,
      overrides || {}
    );
  }
  connect(runner) {
    return super.connect(runner);
  }
  static bytecode = _bytecode;
  static abi = _abi;
  static createInterface() {
    return new Interface(_abi);
  }
  static connect(address, runner) {
    return new Contract(address, _abi, runner);
  }
}

async function checkAccess(dir) {
  try {
    await access(dir, constants.W_OK);
    return true;
  } catch {
    return false;
  }
}
async function existsAsync(fileOrDir) {
  try {
    await stat(fileOrDir);
    return true;
  } catch {
    return false;
  }
}
async function hasCode(signerOrProvider, address) {
  const provider = signerOrProvider.provider || signerOrProvider;
  const code = await provider.getCode(address);
  return code && code !== "0x" ? true : false;
}

const deployment = {
  gasPrice: 1e11,
  gasLimit: 1e6,
  signerAddress: "0x05f32b3cc3888453ff71b01135b34ff8e41263f2",
  transaction: "0xf90f538085174876e800830f42408080b90f00608060405234801561001057600080fd5b50610ee0806100206000396000f3fe6080604052600436106100f35760003560e01c80634d2301cc1161008a578063a8b0574e11610059578063a8b0574e1461025a578063bce38bd714610275578063c3077fa914610288578063ee82ac5e1461029b57600080fd5b80634d2301cc146101ec57806372425d9d1461022157806382ad56cb1461023457806386d516e81461024757600080fd5b80633408e470116100c65780633408e47014610191578063399542e9146101a45780633e64a696146101c657806342cbb15c146101d957600080fd5b80630f28c97d146100f8578063174dea711461011a578063252dba421461013a57806327e86d6e1461015b575b600080fd5b34801561010457600080fd5b50425b6040519081526020015b60405180910390f35b61012d610128366004610a85565b6102ba565b6040516101119190610bbe565b61014d610148366004610a85565b6104ef565b604051610111929190610bd8565b34801561016757600080fd5b50437fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff0140610107565b34801561019d57600080fd5b5046610107565b6101b76101b2366004610c60565b610690565b60405161011193929190610cba565b3480156101d257600080fd5b5048610107565b3480156101e557600080fd5b5043610107565b3480156101f857600080fd5b50610107610207366004610ce2565b73ffffffffffffffffffffffffffffffffffffffff163190565b34801561022d57600080fd5b5044610107565b61012d610242366004610a85565b6106ab565b34801561025357600080fd5b5045610107565b34801561026657600080fd5b50604051418152602001610111565b61012d610283366004610c60565b61085a565b6101b7610296366004610a85565b610a1a565b3480156102a757600080fd5b506101076102b6366004610d18565b4090565b60606000828067ffffffffffffffff8111156102d8576102d8610d31565b60405190808252806020026020018201604052801561031e57816020015b6040805180820190915260008152606060208201528152602001906001900390816102f65790505b5092503660005b8281101561047757600085828151811061034157610341610d60565b6020026020010151905087878381811061035d5761035d610d60565b905060200281019061036f9190610d8f565b6040810135958601959093506103886020850185610ce2565b73ffffffffffffffffffffffffffffffffffffffff16816103ac6060870187610dcd565b6040516103ba929190610e32565b60006040518083038185875af1925050503d80600081146103f7576040519150601f19603f3d011682016040523d82523d6000602084013e6103fc565b606091505b50602080850191909152901515808452908501351761046d577f08c379a000000000000000000000000000000000000000000000000000000000600052602060045260176024527f4d756c746963616c6c333a2063616c6c206661696c656400000000000000000060445260846000fd5b5050600101610325565b508234146104e6576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601a60248201527f4d756c746963616c6c333a2076616c7565206d69736d6174636800000000000060448201526064015b60405180910390fd5b50505092915050565b436060828067ffffffffffffffff81111561050c5761050c610d31565b60405190808252806020026020018201604052801561053f57816020015b606081526020019060019003908161052a5790505b5091503660005b8281101561068657600087878381811061056257610562610d60565b90506020028101906105749190610e42565b92506105836020840184610ce2565b73ffffffffffffffffffffffffffffffffffffffff166105a66020850185610dcd565b6040516105b4929190610e32565b6000604051808303816000865af19150503d80600081146105f1576040519150601f19603f3d011682016040523d82523d6000602084013e6105f6565b606091505b5086848151811061060957610609610d60565b602090810291909101015290508061067d576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601760248201527f4d756c746963616c6c333a2063616c6c206661696c656400000000000000000060448201526064016104dd565b50600101610546565b5050509250929050565b43804060606106a086868661085a565b905093509350939050565b6060818067ffffffffffffffff8111156106c7576106c7610d31565b60405190808252806020026020018201604052801561070d57816020015b6040805180820190915260008152606060208201528152602001906001900390816106e55790505b5091503660005b828110156104e657600084828151811061073057610730610d60565b6020026020010151905086868381811061074c5761074c610d60565b905060200281019061075e9190610e76565b925061076d6020840184610ce2565b73ffffffffffffffffffffffffffffffffffffffff166107906040850185610dcd565b60405161079e929190610e32565b6000604051808303816000865af19150503d80600081146107db576040519150601f19603f3d011682016040523d82523d6000602084013e6107e0565b606091505b506020808401919091529015158083529084013517610851577f08c379a000000000000000000000000000000000000000000000000000000000600052602060045260176024527f4d756c746963616c6c333a2063616c6c206661696c656400000000000000000060445260646000fd5b50600101610714565b6060818067ffffffffffffffff81111561087657610876610d31565b6040519080825280602002602001820160405280156108bc57816020015b6040805180820190915260008152606060208201528152602001906001900390816108945790505b5091503660005b82811015610a105760008482815181106108df576108df610d60565b602002602001015190508686838181106108fb576108fb610d60565b905060200281019061090d9190610e42565b925061091c6020840184610ce2565b73ffffffffffffffffffffffffffffffffffffffff1661093f6020850185610dcd565b60405161094d929190610e32565b6000604051808303816000865af19150503d806000811461098a576040519150601f19603f3d011682016040523d82523d6000602084013e61098f565b606091505b506020830152151581528715610a07578051610a07576040517f08c379a000000000000000000000000000000000000000000000000000000000815260206004820152601760248201527f4d756c746963616c6c333a2063616c6c206661696c656400000000000000000060448201526064016104dd565b506001016108c3565b5050509392505050565b6000806060610a2b60018686610690565b919790965090945092505050565b60008083601f840112610a4b57600080fd5b50813567ffffffffffffffff811115610a6357600080fd5b6020830191508360208260051b8501011115610a7e57600080fd5b9250929050565b60008060208385031215610a9857600080fd5b823567ffffffffffffffff811115610aaf57600080fd5b610abb85828601610a39565b90969095509350505050565b6000815180845260005b81811015610aed57602081850181015186830182015201610ad1565b81811115610aff576000602083870101525b50601f017fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0169290920160200192915050565b600082825180855260208086019550808260051b84010181860160005b84811015610bb1578583037fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe001895281518051151584528401516040858501819052610b9d81860183610ac7565b9a86019a9450505090830190600101610b4f565b5090979650505050505050565b602081526000610bd16020830184610b32565b9392505050565b600060408201848352602060408185015281855180845260608601915060608160051b870101935082870160005b82811015610c52577fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa0888703018452610c40868351610ac7565b95509284019290840190600101610c06565b509398975050505050505050565b600080600060408486031215610c7557600080fd5b83358015158114610c8557600080fd5b9250602084013567ffffffffffffffff811115610ca157600080fd5b610cad86828701610a39565b9497909650939450505050565b838152826020820152606060408201526000610cd96060830184610b32565b95945050505050565b600060208284031215610cf457600080fd5b813573ffffffffffffffffffffffffffffffffffffffff81168114610bd157600080fd5b600060208284031215610d2a57600080fd5b5035919050565b7f4e487b7100000000000000000000000000000000000000000000000000000000600052604160045260246000fd5b7f4e487b7100000000000000000000000000000000000000000000000000000000600052603260045260246000fd5b600082357fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81833603018112610dc357600080fd5b9190910192915050565b60008083357fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe1843603018112610e0257600080fd5b83018035915067ffffffffffffffff821115610e1d57600080fd5b602001915036819003821315610a7e57600080fd5b8183823760009101908152919050565b600082357fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffc1833603018112610dc357600080fd5b600082357fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffa1833603018112610dc357600080fdfea2646970667358221220bb2b5c71a328032f97c676ae39a1ec2148d3e5d6f73d95e9b17910152d61f16264736f6c634300080c00331ca0edce47092c0f398cebf3ffc267f05c8e7076e3b89445e0fe50f6332273d4569ba01b0b9d000e19b24c5869b0fc3b22b0d6fa47cd63316875cbbd577d76e6fde086"};
async function deployMulticall(signer) {
  const provider = signer.provider;
  const codeExists = await hasCode(provider, MULTICALL_ADDRESS);
  if (codeExists) {
    return Multicall__factory.connect(MULTICALL_ADDRESS, signer);
  }
  const { gasPrice, gasLimit, signerAddress, transaction } = deployment;
  const ethCost = BigInt(gasPrice) * BigInt(gasLimit);
  if (await provider.getBalance(signerAddress) < ethCost) {
    if (!signer.isHardhat) {
      console.log(`Funding ${signerAddress} ${formatEther(ethCost)} ETH to deploy Multicall contract`);
    }
    await (await signer.sendTransaction({ to: signerAddress, value: ethCost })).wait();
  }
  await (await provider.broadcastTransaction(transaction)).wait();
  return Multicall__factory.connect(MULTICALL_ADDRESS, signer);
}

const _getSigners = hre.ethers.getSigners;
async function getSigners(options) {
  const signers = ProxySigner.fromSigners(await _getSigners(), {
    ...options || {},
    wrapProvider: true
  });
  const owner = signers[0];
  const provider = owner.provider;
  const multicallCount = Number(provider.multicallMaxCount);
  provider.multicallMaxCount = 0;
  await deployMulticall(owner);
  provider.multicallMaxCount = multicallCount;
  return signers;
}
async function deployERC20(signer, name = "Token", symbol = "TKN", decimals = 18, supply = 1e6) {
  const token = await new ERC20Mock__factory(signer).deploy(
    name,
    symbol,
    decimals,
    parseUnits(String(supply), decimals)
  );
  await token.waitForDeployment();
  return ERC20__factory.connect(token.target, signer);
}

export { checkAccess, deployERC20, existsAsync, getSigners, hasCode };
