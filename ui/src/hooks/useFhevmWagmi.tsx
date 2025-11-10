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
    // Only initialize the browser FHEVM SDK when we are on Sepolia FHEVM.
    // On local Hardhat (31337) or any other chain, we skip SDK init entirely.
    if (chainId !== 11155111) {
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
      chainId === 11155111 &&
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


