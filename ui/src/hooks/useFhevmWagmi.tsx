"use client";

import { useEffect, useState, useCallback } from "react";
import { useAccount, useWalletClient } from "wagmi";
import { GenericStringStorage } from "../fhevm/GenericStringStorage";

// Use CDN loading instead of direct import to avoid bundler issues
declare global {
  interface Window {
    relayerSDK?: {
      initSDK: (options?: any) => Promise<boolean>;
      createInstance: (config: any) => Promise<any>;
      SepoliaConfig: any;
      __initialized__?: boolean;
    };
  }
}

// Single shared storage for FHEVM decryption signatures
const fhevmDecryptionSignatureStorage = new GenericStringStorage("fhevm-sigs");

export function useFhevmWagmi() {
  const { isConnected, address, chainId } = useAccount();
  const { data: walletClient } = useWalletClient();
  const [instance, setInstance] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  const loadSDKFromCDN = useCallback(async (): Promise<void> => {
    const SDK_CDN_URL =
      "https://cdn.zama.ai/relayer-sdk-js/0.2.0/relayer-sdk-js.umd.cjs";

    return new Promise((resolve, reject) => {
      // Already loaded
      if (window.relayerSDK) {
        resolve();
        return;
      }

      const existingScript = document.querySelector(
        `script[src="${SDK_CDN_URL}"]`,
      );
      if (existingScript) {
        const checkInterval = setInterval(() => {
          if (window.relayerSDK) {
            clearInterval(checkInterval);
            resolve();
          }
        }, 100);

        setTimeout(() => {
          clearInterval(checkInterval);
          if (!window.relayerSDK) {
            reject(
              new Error(
                "SDK script loaded but relayerSDK not available on window",
              ),
            );
          }
        }, 10000);
        return;
      }

      const script = document.createElement("script");
      script.src = SDK_CDN_URL;
      script.type = "text/javascript";
      script.async = true;

      script.onload = () => {
        if (window.relayerSDK) {
          resolve();
        } else {
          reject(
            new Error(
              "SDK script loaded but relayerSDK not available on window object",
            ),
          );
        }
      };

      script.onerror = () => {
        reject(
          new Error(`Failed to load Zama Relayer SDK from ${SDK_CDN_URL}`),
        );
      };

      document.head.appendChild(script);
    });
  }, []);

  const initializeFhevm = useCallback(async () => {
    // Initialize FHEVM SDK for Sepolia, or try mock for local Hardhat
    if (chainId !== 11155111 && chainId !== 31337) {
      return false;
    }

    if (!isConnected || !address || !walletClient) {
      setError("Please connect your wallet first");
      return false;
    }

    if (instance) {
      return true;
    }

    try {
      setIsLoading(true);
      setError(null);

      if (!window.relayerSDK) {
        console.log("Loading Zama Relayer SDK from CDN...");
        await loadSDKFromCDN();
      }

      if (!window.relayerSDK) {
        throw new Error("Failed to load Zama Relayer SDK from CDN");
      }

      // For local Hardhat, try to use mock FHEVM
      if (chainId === 31337) {
        try {
          // Try to dynamically import mock utils
          const { MockFhevmInstance } = await import("@fhevm/mock-utils");
          const { JsonRpcProvider } = await import("ethers");
          
          const rpcUrl = "http://127.0.0.1:8545";
          const provider = new JsonRpcProvider(rpcUrl);
          
          // Get FHEVM relayer metadata from Hardhat node using RPC call (same as community-voting)
          let metadata: any = null;
          try {
            // First check if this is a Hardhat node
            const version = await provider.send("web3_clientVersion", []);
            if (typeof version === "string" && version.toLowerCase().includes("hardhat")) {
              // Try to get FHEVM metadata via RPC call
              metadata = await provider.send("fhevm_relayer_metadata", []);
              
              // Validate metadata structure
              if (
                metadata &&
                typeof metadata === "object" &&
                typeof metadata.ACLAddress === "string" &&
                metadata.ACLAddress.startsWith("0x") &&
                typeof metadata.InputVerifierAddress === "string" &&
                metadata.InputVerifierAddress.startsWith("0x") &&
                typeof metadata.KMSVerifierAddress === "string" &&
                metadata.KMSVerifierAddress.startsWith("0x")
              ) {
                console.log("FHEVM metadata retrieved from Hardhat node:", metadata);
              } else {
                console.warn("Invalid FHEVM metadata structure, using defaults");
                metadata = null;
              }
            }
          } catch (e) {
            console.warn("Could not get FHEVM metadata from Hardhat node:", e);
            metadata = null;
          }

          const mockInstance = await MockFhevmInstance.create(
            provider,
            provider,
            metadata
              ? {
                  aclContractAddress: metadata.ACLAddress,
                  chainId: 31337,
                  gatewayChainId: 55815,
                  inputVerifierContractAddress: metadata.InputVerifierAddress,
                  kmsContractAddress: metadata.KMSVerifierAddress,
                  verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
                  verifyingContractAddressInputVerification: "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
                }
              : {
                  aclContractAddress: "0x50157CFfD6bBFA2DECe204a89ec419c23ef5755D",
                  chainId: 31337,
                  gatewayChainId: 55815,
                  inputVerifierContractAddress: "0x901F8942346f7AB3a01F6D7613119Bca447Bb030",
                  kmsContractAddress: "0x1364cBBf2cDF5032C47d8226a6f6FBD2AFCDacAC",
                  verifyingContractAddressDecryption: "0x5ffdaAB0373E62E2ea2944776209aEf29E631A64",
                  verifyingContractAddressInputVerification: "0x812b06e1CDCE800494b79fFE4f925A504a9A9810",
                }
          );
          
          setInstance(mockInstance);
          setIsInitialized(true);
          console.log("FHEVM Mock instance created for local network");
          return true;
        } catch (mockError) {
          console.warn("Failed to create FHEVM mock instance:", mockError);
          setError("Local FHEVM mock not available. Install @fhevm/mock-utils or use Sepolia network.");
          return false;
        }
      }

      // For Sepolia, use real SDK
      const { initSDK, createInstance, SepoliaConfig } = window.relayerSDK;

      if (!window.relayerSDK.__initialized__) {
        await initSDK();
        window.relayerSDK.__initialized__ = true;
      }

      const config = {
        ...SepoliaConfig,
        network: walletClient.transport as any,
      };

      const fhevmInstance = await createInstance(config);
      setInstance(fhevmInstance);
      setIsInitialized(true);
      return true;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to initialize FHEVM";
      setError(errorMessage);
      console.error("Failed to initialize FHEVM:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected, address, walletClient, instance, loadSDKFromCDN, chainId]);

  useEffect(() => {
    if (
      (chainId === 11155111 || chainId === 31337) &&
      isConnected &&
      address &&
      walletClient &&
      !instance &&
      !isLoading
    ) {
      void initializeFhevm();
    }
  }, [
    chainId,
    isConnected,
    address,
    walletClient,
    instance,
    isLoading,
    initializeFhevm,
  ]);

  return {
    instance,
    isLoading,
    error,
    isInitialized,
    initializeFhevm,
    fhevmDecryptionSignatureStorage,
  };
}


