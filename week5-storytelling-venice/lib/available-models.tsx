export interface AvailableModel {
  id: string;
  name: string;
  provider: string;
  isFree: boolean;
  inputCostPer1M: number;
  outputCostPer1M: number;
  contextWindow: number;
  description: string;
}

// Models and pricing from OpenRouter (as of current data)
export const availableModels: AvailableModel[] = [
  {
    id: "mistral-31-24b",
    name: "Mistral 31 24B",
    provider: "Mistral",
    isFree: true,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    contextWindow: 8192,
    description: "Default",
  },
  {
    id: "llama-3.2-3b",
    name: "Llama 3.2 3B",
    provider: "Llama",
    isFree: true,
    inputCostPer1M: 0,
    outputCostPer1M: 0,
    contextWindow: 8192,
    description: "Default 2",
  },
];

// Helper function to get a model by ID
export function getModelById(id: string): AvailableModel | undefined {
  return availableModels.find((model) => model.id === id);
}

// Helper function to get free models
export function getFreeModels(): AvailableModel[] {
  return availableModels.filter((model) => model.isFree);
}

// Helper function to get paid models
export function getPaidModels(): AvailableModel[] {
  return availableModels.filter((model) => !model.isFree);
}

// Default model ID
export const DEFAULT_MODEL_ID = "mistral-31-24b";
