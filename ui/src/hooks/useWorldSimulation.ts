import { useCallback, useMemo, useState } from "react";
import { ethers } from "ethers";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import {
  WORLDSIMULATION_ADDRESS_LOCAL,
  WORLDSIMULATION_ADDRESS_SEPOLIA,
  WorldSimulationABI,
} from "../config/contracts";
import { useFhevmWagmi } from "./useFhevmWagmi";
import { FhevmDecryptionSignature } from "../fhevm/FhevmDecryptionSignature";

export type WorldStateDecoded = {
  worldEvolution: bigint;
  stability: bigint;
  innovation: bigint;
  mystery: bigint;
  decisionsCount: bigint;
};

type DecisionDeltas = {
  worldEvolutionDelta: number;
  stabilityDelta: number;
  innovationDelta: number;
  mysteryDelta: number;
};

export function useWorldSimulation() {
  const { chainId, address } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { instance: fhevmInstance, fhevmDecryptionSignatureStorage } =
    useFhevmWagmi();

  const [decodedState, setDecodedState] = useState<WorldStateDecoded | null>(
    null,
  );
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string>("");
  
  // Local state tracking for non-FHEVM networks (fallback)
  const [localWorldState, setLocalWorldState] = useState<WorldStateDecoded>({
    worldEvolution: 0n,
    stability: 0n,
    innovation: 0n,
    mystery: 0n,
    decisionsCount: 0n,
  });

  const contractAddress = useMemo(() => {
    // Local Hardhat (localhost, chainId 31337)
    if (chainId === 31337) {
      return WORLDSIMULATION_ADDRESS_LOCAL as `0x${string}`;
    }
    // Sepolia FHEVM (to be wired later)
    if (chainId === 11155111) {
      return WORLDSIMULATION_ADDRESS_SEPOLIA as `0x${string}`;
    }
    return undefined;
  }, [chainId]);

  const decryptWorldState = useCallback(async () => {
    if (!publicClient || !contractAddress) return;

    try {
      setIsBusy(true);
      setMessage("Reading encrypted world state from contract...");

      const [eWorldEvolution, eStability, eInnovation, eMystery] =
        (await publicClient.readContract({
          address: contractAddress,
          abi: WorldSimulationABI,
          functionName: "getWorldState",
        })) as [string, string, string, string];

      const eDecisions = (await publicClient.readContract({
        address: contractAddress,
        abi: WorldSimulationABI,
        functionName: "getDecisionsCount",
      })) as string;

      // Check if we should use local state (fallback)
      if (chainId === 31337 && !fhevmInstance && localWorldState.decisionsCount > 0n) {
        setDecodedState(localWorldState);
        setMessage("Using local state (FHEVM mock not available). Install @fhevm/mock-utils for real FHE.");
        setIsBusy(false);
        return;
      }
      
      if (!fhevmInstance) {
        setMessage(
          "FHEVM instance not ready. Please wait for initialization or use a supported network.",
        );
        setIsBusy(false);
        return;
      }

      const allHandles = [
        eWorldEvolution,
        eStability,
        eInnovation,
        eMystery,
        eDecisions,
      ];

      // Filter out ZeroHash (uninitialized handles)
      const nonZeroPairs = allHandles
        .filter((h) => h !== ethers.ZeroHash)
        .map((h) => ({
          handle: h,
          contractAddress,
        }));

      if (nonZeroPairs.length === 0) {
        setDecodedState({
          worldEvolution: 0n,
          stability: 0n,
          innovation: 0n,
          mystery: 0n,
          decisionsCount: 0n,
        });
        setMessage(
          "World state is still zero (no encrypted decisions applied on-chain).",
        );
        return;
      }

      // FHE decryption (works for both Sepolia and local mock)
      setMessage("Requesting FHEVM decryption for world state...");

      // For local mock network, use simplified decryption
      if (chainId === 31337) {
        try {
          // Try mock-specific decryption method if available
          if (fhevmInstance.userDecryptEuint) {
            const userAddress = walletClient?.account.address || address;
            if (!userAddress) {
              throw new Error("No user address available");
            }

            // Import ethers for signer if needed
            const { BrowserProvider } = await import("ethers");
            const browserProvider = new BrowserProvider((window as any).ethereum);
            const signer = await browserProvider.getSigner();

            const evolution = await fhevmInstance.userDecryptEuint(
              "euint32",
              eWorldEvolution,
              contractAddress,
              signer,
            );
            const stability = await fhevmInstance.userDecryptEuint(
              "euint32",
              eStability,
              contractAddress,
              signer,
            );
            const innovation = await fhevmInstance.userDecryptEuint(
              "euint32",
              eInnovation,
              contractAddress,
              signer,
            );
            const mystery = await fhevmInstance.userDecryptEuint(
              "euint32",
              eMystery,
              contractAddress,
              signer,
            );
            const decisionsCount = await fhevmInstance.userDecryptEuint(
              "euint32",
              eDecisions,
              contractAddress,
              signer,
            );

            const decoded = {
              worldEvolution: BigInt(evolution || 0),
              stability: BigInt(stability || 0),
              innovation: BigInt(innovation || 0),
              mystery: BigInt(mystery || 0),
              decisionsCount: BigInt(decisionsCount || 0),
            };
            
            setDecodedState(decoded);
            // Also update local state as backup
            setLocalWorldState(decoded);

            setMessage("World state decrypted successfully (local mock).");
            return;
          }
        } catch (e) {
          console.warn("Local mock decryption failed, trying standard method:", e);
          // Fall through to standard method
        }
      }

      // Standard FHE decryption (for Sepolia or if mock method failed)
      if (typeof window === "undefined" || !(window as any).ethereum) {
        throw new Error("No injected Ethereum provider found for decryption");
      }

      const browserProvider = new ethers.BrowserProvider(
        (window as any).ethereum,
      );
      const signer = await browserProvider.getSigner();

      const sig = await FhevmDecryptionSignature.loadOrSign(
        fhevmInstance,
        [contractAddress],
        signer,
        fhevmDecryptionSignatureStorage,
      );

      if (!sig) {
        setMessage("Unable to build FHEVM decryption signature");
        return;
      }

      const result = await fhevmInstance.userDecrypt(
        nonZeroPairs,
        sig.privateKey,
        sig.publicKey,
        sig.signature,
        sig.contractAddresses,
        sig.userAddress,
        sig.startTimestamp,
        sig.durationDays,
      );

      const getVal = (h: string) => BigInt(result[h] ?? 0);

      const decoded = {
        worldEvolution: getVal(eWorldEvolution),
        stability: getVal(eStability),
        innovation: getVal(eInnovation),
        mystery: getVal(eMystery),
        decisionsCount: getVal(eDecisions),
      };
      
      setDecodedState(decoded);
      // Update local state as backup
      if (chainId === 31337) {
        setLocalWorldState(decoded);
      }

      setMessage("World state decrypted successfully with FHEVM.");
    } catch (e) {
      console.error(e);
      setMessage("Failed to read/decrypt world state.");
      
      // Fallback to local state if available
      if (chainId === 31337 && localWorldState.decisionsCount > 0n) {
        setDecodedState(localWorldState);
        setMessage("Using local state as fallback.");
      }
    } finally {
      setIsBusy(false);
    }
  }, [publicClient, contractAddress, fhevmInstance, chainId, fhevmDecryptionSignatureStorage, walletClient, address, localWorldState]);

  const applyEncryptedDecision = useCallback(
    async (deltas: DecisionDeltas) => {
      if (!walletClient || !contractAddress) return;

      try {
        setIsBusy(true);

        // Try to use FHEVM instance if available (works for both Sepolia and local mock)
        if (!fhevmInstance && chainId === 31337) {
          // Fallback: update local state for non-FHEVM local network
          setMessage("Using local state tracking (FHEVM mock not available)...");
          
          // Calculate updated state
          const updatedState: WorldStateDecoded = {
            worldEvolution: localWorldState.worldEvolution + BigInt(Math.max(0, deltas.worldEvolutionDelta)),
            stability: localWorldState.stability + BigInt(Math.max(0, deltas.stabilityDelta)),
            innovation: localWorldState.innovation + BigInt(Math.max(0, deltas.innovationDelta)),
            mystery: localWorldState.mystery + BigInt(Math.max(0, deltas.mysteryDelta)),
            decisionsCount: localWorldState.decisionsCount + 1n,
          };
          
          // Update both local state and decoded state
          setLocalWorldState(updatedState);
          setDecodedState(updatedState);
          
          // Also try to send to contract (may fail but worth trying)
          try {
            const zeroHandle = "0x0000000000000000000000000000000000000000000000000000000000000000";
            const emptyProof = "0x";
            const tx = await walletClient.writeContract({
              address: contractAddress,
              abi: WorldSimulationABI,
              functionName: "applyEncryptedDecision",
              args: [zeroHandle, zeroHandle, zeroHandle, zeroHandle, emptyProof],
            });
            if (publicClient) {
              await publicClient.waitForTransactionReceipt({ hash: tx });
            }
          } catch (e) {
            console.warn("Contract call failed, but local state updated:", e);
          }
          
          setMessage("Decision applied (local state tracking). Install FHEVM mock for real encryption.");
          setIsBusy(false);
          return;
        }
        
        if (!fhevmInstance) {
          setMessage(
            "FHEVM instance not ready. Please wait or switch to a supported network.",
          );
          setIsBusy(false);
          return;
        }

        // FHE encryption path (works for both Sepolia and local mock)
        setMessage("Encrypting decision with FHEVM...");

        const input = fhevmInstance.createEncryptedInput(
          contractAddress,
          walletClient.account.address,
        );

        input.add32(deltas.worldEvolutionDelta);
        input.add32(deltas.stabilityDelta);
        input.add32(deltas.innovationDelta);
        input.add32(deltas.mysteryDelta);

        const enc = await input.encrypt();

        // Normalize handles and proof to 0x-prefixed hex strings for viem
        const handlesHex = enc.handles.map((h: any) =>
          typeof h === "string"
            ? (h as `0x${string}`)
            : (ethers.hexlify(h) as `0x${string}`),
        );

        const proofHex =
          typeof enc.inputProof === "string"
            ? (enc.inputProof as `0x${string}`)
            : (ethers.hexlify(enc.inputProof as any) as `0x${string}`);

        const tx = await walletClient.writeContract({
          address: contractAddress,
          abi: WorldSimulationABI,
          functionName: "applyEncryptedDecision",
          args: [
            handlesHex[0],
            handlesHex[1],
            handlesHex[2],
            handlesHex[3],
            proofHex,
          ],
        });

        setMessage(`Waiting for tx ${tx} to be mined...`);
        if (publicClient) {
          await publicClient.waitForTransactionReceipt({ hash: tx });
        }
        setMessage("Encrypted decision submitted successfully. Refreshing world state...");
        
        // Automatically refresh world state after successful submission
        setTimeout(async () => {
          try {
            await decryptWorldState();
          } catch (e) {
            console.error("Failed to auto-refresh world state:", e);
          }
        }, 1000);
      } catch (e) {
        console.error(e);
        setMessage("Failed to submit encrypted decision.");
      } finally {
        setIsBusy(false);
      }
    },
    [walletClient, contractAddress, publicClient, fhevmInstance, chainId, localWorldState, decryptWorldState],
  );

  return {
    contractAddress,
    canApplyDecision: !!walletClient && !!contractAddress,
    canDecrypt: !!publicClient && !!contractAddress,
    applyEncryptedDecision,
    decryptWorldState,
    decodedState,
    isBusy,
    message,
  };
}
