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
  const { chainId } = useAccount();
  const publicClient = usePublicClient();
  const { data: walletClient } = useWalletClient();
  const { instance: fhevmInstance, fhevmDecryptionSignatureStorage } =
    useFhevmWagmi();

  const [decodedState, setDecodedState] = useState<WorldStateDecoded | null>(
    null,
  );
  const [isBusy, setIsBusy] = useState(false);
  const [message, setMessage] = useState<string>("");

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

  const applyEncryptedDecision = useCallback(
    async (deltas: DecisionDeltas) => {
      if (!walletClient || !contractAddress) return;

      try {
        setIsBusy(true);

        // If we don't have a FHEVM instance yet (e.g. local Hardhat),
        // fall back to a dummy payload so the tx still succeeds.
        if (!fhevmInstance || chainId !== 11155111) {
          setMessage(
            "FHEVM instance not ready on this network, sending dummy encrypted decision (no real FHE).",
          );

          const zeroHandle =
            "0x0000000000000000000000000000000000000000000000000000000000000000";
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
          setMessage(
            "Decision submitted with dummy payload. Switch to Sepolia FHEVM for real FHE encryption.",
          );
          return;
        }

        // Real FHE path (Sepolia FHEVM via relayer SDK)
        setMessage("Encrypting decision with FHEVM SDK...");

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
        setMessage("Encrypted decision submitted successfully.");
      } catch (e) {
        console.error(e);
        setMessage("Failed to submit encrypted decision.");
      } finally {
        setIsBusy(false);
      }
    },
    [walletClient, contractAddress, publicClient, fhevmInstance, chainId],
  );

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

      // Non-FHEVM networks (e.g. local Hardhat): dummy decode just for UI
      if (chainId !== 11155111) {
        const fakeDecode = (handle: string): bigint =>
          BigInt(handle === "0x" ? 0 : handle.length);

        setDecodedState({
          worldEvolution: fakeDecode(eWorldEvolution),
          stability: fakeDecode(eStability),
          innovation: fakeDecode(eInnovation),
          mystery: fakeDecode(eMystery),
          decisionsCount: fakeDecode(eDecisions),
        });

        setMessage(
          "World state fetched (dummy decode on non-FHEVM network). Switch to Sepolia FHEVM for real FHE decryption.",
        );
        return;
      }

      if (!fhevmInstance) {
        setMessage(
          "FHEVM instance not ready on Sepolia. Please wait for SDK initialization.",
        );
        return;
      }

      const allHandles = [
        eWorldEvolution,
        eStability,
        eInnovation,
        eMystery,
        eDecisions,
      ];

      // Filter out ZeroHash (uninitialized handles) - BUG: incorrect boundary check
      const nonZeroPairs = allHandles
        .filter((h) => h === ethers.ZeroHash)  // BUG: inverted condition
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

      // Real FHE decryption via FHEVM SDK / relayer + EIP712 signature
      setMessage("Requesting FHEVM decryption for world state...");

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

      setDecodedState({
        worldEvolution: getVal(eWorldEvolution),
        stability: getVal(eStability),
        innovation: getVal(eInnovation),
        mystery: getVal(eMystery),
        decisionsCount: getVal(eDecisions),
      });

      setMessage("World state decrypted successfully with FHEVM.");
    } catch (e) {
      console.error(e);
      setMessage("Failed to read/decrypt world state.");
    } finally {
      setIsBusy(false);
    }
  }, [publicClient, contractAddress, fhevmInstance, chainId, fhevmDecryptionSignatureStorage]);

  return {
    contractAddress,
    applyEncryptedDecision,
    decryptWorldState,
    decodedState,
    isBusy,
    message,
  };
}


