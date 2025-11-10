# Cipher Dreamscape World 🌍

**FHE-Powered Encrypted World Simulation Game**

[![Demo Video](https://img.shields.io/badge/Demo-Video-blue)](https://github.com/duan-hb/cipher-dreamscape-world/raw/main/cipher-dreamscape-world.mp4)
[![Vercel Deployment](https://img.shields.io/badge/Deployed-Vercel-black)](https://cipher-dreamscape-world.vercel.app/)

A complete end-to-end example of an **FHE-powered world simulation** where players make encrypted decisions that homomorphically aggregate into a shared encrypted world state.

## 🎯 Overview

This project demonstrates the full **Fully Homomorphic Encryption (FHE)** workflow:

1. **Players submit encrypted decisions** to a `WorldSimulation` contract
2. **Contract aggregates decisions homomorphically** into encrypted world KPIs
3. **Frontend decrypts world state** to drive visual world representation
4. **All computation happens on encrypted data** - no plaintext values ever touch the blockchain

### Key Features

- 🔐 **End-to-End Encryption**: Data encrypted in browser, processed encrypted on-chain
- ⚡ **Homomorphic Aggregation**: Encrypted decisions aggregate without decryption
- 🎮 **Real-time World State**: Decrypted KPIs drive dynamic world visualization
- 🌐 **Multi-Network Support**: Local Hardhat + Sepolia FHEVM testnet
- 🎨 **Beautiful UI**: Modern React + Tailwind + shadcn/ui interface

## 📺 Demo Video

[Watch the full demo](https://github.com/duan-hb/cipher-dreamscape-world/raw/main/cipher-dreamscape-world.mp4) to see the complete FHE workflow in action!

## 🚀 Live Demo

**Try it now:** [https://cipher-dreamscape-world.vercel.app/](https://cipher-dreamscape-world.vercel.app/)

Connect your wallet and experience real FHE encryption/decryption!

## 🏗️ Architecture

### World State KPIs
- **World Evolution**: Overall progress and advancement
- **Stability**: System stability and order
- **Innovation**: Technology and creativity
- **Mystery**: Chaos and unknown elements
- **Decisions Count**: Total aggregated decisions

### Data Flow
```
Clear Decision → FHE Encryption → On-Chain Aggregation → Encrypted State → FHE Decryption → Visual World
     ↓              ↓                  ↓                     ↓                ↓             ↓
   Browser       Browser SDK         Contract           Contract        Relayer SDK    Frontend
   Logic         (createEncryptedInput) (FHE.add)        Storage        (userDecrypt)  Display
```

## 📋 Project Structure

```
cipher-dreamscape-world/
├── contracts/WorldSimulation.sol    # Main FHE contract
├── deploy/deploy.ts                 # Hardhat deployment script
├── test/                            # Contract tests
│   ├── WorldSimulation.ts          # Local mock tests
│   └── WorldSimulationSepolia.ts   # Sepolia FHEVM tests
├── ui/                             # Frontend application
│   ├── src/
│   │   ├── components/             # React components
│   │   ├── hooks/                  # Custom hooks
│   │   ├── fhevm/                  # FHE utilities
│   │   └── config/                 # Contract configs
│   └── dist/                       # Built assets
├── vercel.json                     # Deployment config
└── README.md
```

## 🔧 Smart Contract

### WorldSimulation.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint32, externalEuint32} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title WorldSimulation - Encrypted world state driven by private player decisions
contract WorldSimulation is SepoliaConfig {
    // Encrypted world KPIs stored on-chain
    euint32 private _worldEvolution;
    euint32 private _stability;
    euint32 private _innovation;
    euint32 private _mystery;
    euint32 private _decisionsCount;

    event DecisionApplied(address indexed sender);

    /// @notice Get current encrypted world state
    function getWorldState() external view returns (euint32, euint32, euint32, euint32) {
        return (_worldEvolution, _stability, _innovation, _mystery);
    }

    /// @notice Get encrypted decisions count
    function getDecisionsCount() external view returns (euint32) {
        return _decisionsCount;
    }

    /// @notice Apply encrypted decision deltas homomorphically
    function applyEncryptedDecision(
        externalEuint32 worldEvolutionDeltaHandle,
        externalEuint32 stabilityDeltaHandle,
        externalEuint32 innovationDeltaHandle,
        externalEuint32 mysteryDeltaHandle,
        bytes calldata inputProof
    ) external {
        // Convert external handles to internal encrypted values
        euint32 worldEvolutionDelta = FHE.fromExternal(worldEvolutionDeltaHandle, inputProof);
        euint32 stabilityDelta = FHE.fromExternal(stabilityDeltaHandle, inputProof);
        euint32 innovationDelta = FHE.fromExternal(innovationDeltaHandle, inputProof);
        euint32 mysteryDelta = FHE.fromExternal(mysteryDeltaHandle, inputProof);

        // Homomorphic addition - no decryption needed!
        _worldEvolution = FHE.add(_worldEvolution, worldEvolutionDelta);
        _stability = FHE.add(_stability, stabilityDelta);
        _innovation = FHE.add(_innovation, innovationDelta);
        _mystery = FHE.add(_mystery, mysteryDelta);

        // Increment decision counter
        _decisionsCount = FHE.add(_decisionsCount, FHE.asEuint32(1));

        // Grant decryption permissions
        FHE.allowThis(_worldEvolution);
        FHE.allowThis(_stability);
        FHE.allowThis(_innovation);
        FHE.allowThis(_mystery);
        FHE.allowThis(_decisionsCount);

        FHE.allow(_worldEvolution, msg.sender);
        FHE.allow(_stability, msg.sender);
        FHE.allow(_innovation, msg.sender);
        FHE.allow(_mystery, msg.sender);
        FHE.allow(_decisionsCount, msg.sender);

        emit DecisionApplied(msg.sender);
    }
}
```

### Key FHE Concepts

#### 1. Encrypted Data Types
- `euint32`: Encrypted 32-bit unsigned integer
- `externalEuint32`: Handle to encrypted value from external source

#### 2. Homomorphic Operations
- `FHE.add()`: Add two encrypted values without decryption
- `FHE.fromExternal()`: Convert external handle to internal encrypted value
- `FHE.asEuint32()`: Encrypt a constant value

#### 3. Permission Management
- `FHE.allow()`: Grant decryption permission to addresses
- `FHE.allowThis()`: Allow contract to re-encrypt for oracle

## 🎮 Frontend FHE Integration

### Encryption Flow

```typescript
// 1. Create encrypted input for contract
const input = fhevmInstance.createEncryptedInput(
  contractAddress,
  userAddress
);

// 2. Add decision values (still in plaintext here)
input.add32(worldEvolutionDelta);  // e.g., +5
input.add32(stabilityDelta);       // e.g., -2
input.add32(innovationDelta);      // e.g., +7
input.add32(mysteryDelta);         // e.g., +3

// 3. Encrypt all values at once
const encrypted = await input.encrypt();
// Result: { handles: [handle1, handle2, handle3, handle4], inputProof }

// 4. Submit to contract (data stays encrypted!)
await walletClient.writeContract({
  address: contractAddress,
  functionName: "applyEncryptedDecision",
  args: [encrypted.handles[0], encrypted.handles[1], ...encrypted.handles[3], encrypted.inputProof]
});
```

### Decryption Flow

```typescript
// 1. Read encrypted handles from contract
const [eWorldEvolution, eStability, eInnovation, eMystery] =
  await publicClient.readContract({
    address: contractAddress,
    functionName: "getWorldState"
  });

// 2. Prepare decryption request with EIP-712 signature
const signature = await FhevmDecryptionSignature.loadOrSign(
  fhevmInstance,
  [contractAddress],
  signer,
  storage
);

// 3. Decrypt via FHEVM relayer
const result = await fhevmInstance.userDecrypt(
  [
    { handle: eWorldEvolution, contractAddress },
    { handle: eStability, contractAddress },
    // ... more handles
  ],
  signature.privateKey,
  signature.publicKey,
  signature.signature,
  signature.contractAddresses,
  signature.userAddress,
  signature.startTimestamp,
  signature.durationDays
);

// 4. Update UI with decrypted values
setDecodedState({
  worldEvolution: BigInt(result[eWorldEvolution]),
  stability: BigInt(result[eStability]),
  // ... etc
});
```

## 📦 Installation & Setup

### 1. Install Dependencies

```bash
# Root directory
npm install

# Frontend
cd ui && npm install
```

### 2. Configure WalletConnect

Edit `ui/src/main.tsx`:

```typescript
const wagmiConfig = getDefaultConfig({
  appName: "Cipher Dreamscape World",
  projectId: "your-walletconnect-project-id", // Replace with your ID
  chains: [hardhatLocal, sepolia, mainnet],
  ssr: false,
});
```

### 3. Start Development

```bash
# Terminal 1: Start Hardhat node
npx hardhat node

# Terminal 2: Deploy contract
npx hardhat deploy --network localhost

# Terminal 3: Start frontend
cd ui && npm run dev
```

## 🌐 Deployed Contracts

| Network | Address | Explorer |
|---------|---------|----------|
| **Local Hardhat** | `0x5FbDB2315678afecb367f032d93F642f64180aa3` | N/A |
| **Sepolia FHEVM** | `0x6DE09452e3B7f2C84bFD5F8e4ce494EB32bFCF4b` | [Etherscan](https://sepolia.etherscan.io/address/0x6DE09452e3B7f2C84bFD5F8e4ce494EB32bFCF4b) |

## 🧪 Testing

### Local Mock Tests
```bash
npx hardhat test
```

### Sepolia FHEVM Tests
```bash
npx hardhat test --network sepolia test/WorldSimulationSepolia.ts
```

## 🚀 Deployment

### Smart Contract
```bash
# Local
npx hardhat deploy --network localhost

# Sepolia FHEVM
npx hardhat deploy --network sepolia
```

### Frontend
```bash
cd ui && npm run build
```

The project includes `vercel.json` for easy Vercel deployment.

## 🔐 Security & Privacy

- **Zero-Knowledge**: Contract never sees plaintext decision values
- **Homomorphic Security**: All aggregation happens on encrypted data
- **Permissioned Decryption**: Only authorized users can decrypt results
- **EIP-712 Signatures**: Secure decryption authorization via signed messages

## 🛠️ Tech Stack

### Blockchain
- **Solidity** - Smart contract development
- **Hardhat** - Development framework
- **FHEVM** - Fully Homomorphic Encryption VM
- **Zama FHEVM SDK** - Encryption/decryption utilities

### Frontend
- **React + TypeScript** - UI framework
- **Vite** - Build tool
- **RainbowKit + Wagmi** - Wallet connection
- **Tailwind CSS + shadcn/ui** - Styling
- **React Query** - Data fetching

### Testing
- **Chai + Mocha** - Test framework
- **Hardhat Network** - Local blockchain
- **Sepolia FHEVM** - Testnet with real FHE

## 📚 Learn More

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [Zama FHEVM GitHub](https://github.com/zama-ai/fhevm)
- [RainbowKit Docs](https://www.rainbowkit.com/)
- [Wagmi Documentation](https://wagmi.sh/)

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ using FHEVM - The future of private blockchain computation**


