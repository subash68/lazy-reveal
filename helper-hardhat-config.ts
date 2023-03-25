export interface networkConfigItem {
  blockConfirmations?: number;
  blockWaitingTime?: number;
  apiKey?: string;
}

export interface networkConfigInfo {
  [key: string]: networkConfigItem;
}

// Network based configuration
export const networkConfig: networkConfigInfo = {
  hardhat: {},
  localhost: {},
  mumbai: {
    blockConfirmations: 2,
    apiKey: process.env.POLYGONSCAN_API_KEY,
  },
  goerli: {
    blockConfirmations: 2,
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export const developmentChains = ["hardhat", "localhost"]; // local development chains
export const deploymentFile = "contracts.json";
export const ADDRESS_ZERO = "0x0000000000000000000000000000000000000000";

// Deployment configuration
export const VOODOO_NFT_CONTRACT = "VoodooRewards";
export const VOODOO_MULTI_REWARD = "VoodooMultiRewards";
export const REVEAL_AFTER = 3600; // 1 hour
export const MAX_SUPPLY = 10; // 0 - 9 tokens will be minted
export const PRICE_PER_TOKEN = 0.001;
export const DEFAULT_TOKEN_ALLOCATION = 1;
export const DEFAULT_TOKEN_ID = 1;
export const CONTRACT_NAME = "TEST CONTRACT";
export const CONTRACT_SYMBOL = "TCC";

export const DEFAULT_TREASURY = "";

export const PRE_REVEAL_BASE_URI =
  "https://gateway.pinata.cloud/ipfs/QmZDk3hcmMCiPP5GfCRF29CigfrNZk1ohgvHXwAT2J5aJm/";
export const PRE_REVEAL_METADATA = "base.json";
export const POST_REVEAL_BASE_URI =
  "https://gateway.pinata.cloud/ipfs/QmNMJfgzTxsrHi6vGVm3NWtfMvxS6SeMs2MxV9WGWYVPDC/";
export const CONTRACT_URI =
  "https://gateway.pinata.cloud/ipfs/QmXtex5rwo3QR7b8yfyqW8soJCFXZJQvgCo8sfWWEcyA6E";

//   ERROR MESSAGES
export const OPERATOR_ERROR_MESSAGE = "Caller is not an operator";
export const INSUFFICIENT_BALANCE = "Insufficient balance";

export const REVEAL_TIMER_ERROR = "Cannot reveal before timer";
export const REVEAL_PERMISSION_ERROR = "Permission denied to reveal NFT";
export const DUPLICATE_REVEAL_ERROR = "Already revealed";

export const WITHDRAW_ERROR = "Caller is not owner";
