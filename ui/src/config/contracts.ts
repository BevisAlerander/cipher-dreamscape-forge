// WorldSimulation contract config used by the UI.
// Fill in the deployed address once you have deployed the contract with Hardhat.

// Local Hardhat network (chainId 31337)
export const WORLDSIMULATION_ADDRESS_LOCAL =
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

// Sepolia FHEVM (chainId 11155111)
export const WORLDSIMULATION_ADDRESS_SEPOLIA =
  "0x6DE09452e3B7f2C84bFD5F8e4ce494EB32bFCF4b";

export const WorldSimulationABI = [
  {
    inputs: [],
    name: "getWorldState",
    outputs: [
      { internalType: "euint32", name: "worldEvolution", type: "bytes32" },
      { internalType: "euint32", name: "stability", type: "bytes32" },
      { internalType: "euint32", name: "innovation", type: "bytes32" },
      { internalType: "euint32", name: "mystery", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getDecisionsCount",
    outputs: [
      { internalType: "euint32", name: "decisionsCount", type: "bytes32" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "externalEuint32", name: "worldEvolutionDeltaHandle", type: "bytes32" },
      { internalType: "externalEuint32", name: "stabilityDeltaHandle", type: "bytes32" },
      { internalType: "externalEuint32", name: "innovationDeltaHandle", type: "bytes32" },
      { internalType: "externalEuint32", name: "mysteryDeltaHandle", type: "bytes32" },
      { internalType: "bytes", name: "inputProof", type: "bytes" }
    ],
    name: "applyEncryptedDecision",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "sender", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "DecisionApplied",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "sender", type: "address" },
      { indexed: false, internalType: "uint256", name: "previousCount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newCount", type: "uint256" }
    ],
    name: "DecisionCountUpdated",
    type: "event"
  }
] as const;


