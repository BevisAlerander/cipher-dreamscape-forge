export type EIP712Type = {
  domain: any;
  message: any;
  primaryType: string;
  types: Record<string, any>;
};

export type FhevmInstance = {
  createEncryptedInput: (contractAddress: string, userAddress: string) => any;
  createEIP712: (
    publicKey: string,
    contractAddresses: string[],
    startTimestamp: number,
    durationDays: number,
  ) => EIP712Type;
  generateKeypair: () => { publicKey: string; privateKey: string };
  userDecrypt: (
    handleContractPairs: Array<{ handle: string; contractAddress: string }>,
    privateKey: string,
    publicKey: string,
    signature: string,
    contractAddresses: string[],
    userAddress: string,
    startTimeStamp: number,
    durationDays: number,
  ) => Promise<Record<string, bigint | string | number>>;
};

export type FhevmDecryptionSignatureType = {
  publicKey: string;
  privateKey: string;
  signature: string;
  startTimestamp: number;
  durationDays: number;
  userAddress: `0x${string}`;
  contractAddresses: `0x${string}`[];
  eip712: EIP712Type;
};


