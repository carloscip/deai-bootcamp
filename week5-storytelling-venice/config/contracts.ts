// Contract addresses for the application
export const CONTRACTS = {
  MIPPY_TOKEN: "0x121f6CD61DE0839a14823B97d751698013811d6f",
  DEPOSIT_MANAGER: "0xFF000Ac34DC506E10cb4116Ddaab336150aB96e9",
  AI_MODEL_QUERY: "0x162857970E8807D706DAF3F0CA5aD2443F5A14f1",
} as const;

// Type for contract addresses
export type ContractAddress = typeof CONTRACTS[keyof typeof CONTRACTS]; 