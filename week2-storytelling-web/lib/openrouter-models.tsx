export interface OpenRouterModel {
    id: string
    name: string
    provider: string
    isFree: boolean
    inputCostPer1M: number
    outputCostPer1M: number
    contextWindow: number
    description: string
  }
  
  // Models and pricing from OpenRouter (as of current data)
  export const openRouterModels: OpenRouterModel[] = [
    // Free models
    {
      id: "meta-llama/llama-3-8b-instruct",
      name: "Llama 3 8B",
      provider: "Meta",
      isFree: true,
      inputCostPer1M: 0,
      outputCostPer1M: 0,
      contextWindow: 8192,
      description: "Meta's smallest Llama 3 model, good for simple tasks",
    },
    {
      id: "mistralai/mistral-7b-instruct",
      name: "Mistral 7B",
      provider: "Mistral AI",
      isFree: true,
      inputCostPer1M: 0,
      outputCostPer1M: 0,
      contextWindow: 8192,
      description: "Efficient open-source 7B parameter model",
    },
    {
      id: "google/gemma-7b-it",
      name: "Gemma 7B",
      provider: "Google",
      isFree: true,
      inputCostPer1M: 0,
      outputCostPer1M: 0,
      contextWindow: 8192,
      description: "Google's lightweight instruction-tuned model",
    },
  
    // Paid models - GPT
    {
      id: "openai/gpt-3.5-turbo",
      name: "GPT-3.5 Turbo",
      provider: "OpenAI",
      isFree: false,
      inputCostPer1M: 0.5,
      outputCostPer1M: 1.5,
      contextWindow: 16385,
      description: "Fast and cost-effective model for most tasks",
    },
    {
      id: "openai/gpt-4-turbo",
      name: "GPT-4 Turbo",
      provider: "OpenAI",
      isFree: false,
      inputCostPer1M: 10,
      outputCostPer1M: 30,
      contextWindow: 128000,
      description: "Powerful model with strong reasoning capabilities",
    },
    {
      id: "openai/gpt-4o",
      name: "GPT-4o",
      provider: "OpenAI",
      isFree: false,
      inputCostPer1M: 5,
      outputCostPer1M: 15,
      contextWindow: 128000,
      description: "OpenAI's latest optimized model",
    },
  
    // Paid models - Claude
    {
      id: "anthropic/claude-3-haiku",
      name: "Claude 3 Haiku",
      provider: "Anthropic",
      isFree: false,
      inputCostPer1M: 0.25,
      outputCostPer1M: 1.25,
      contextWindow: 200000,
      description: "Fast, compact model for everyday tasks",
    },
    {
      id: "anthropic/claude-3-sonnet",
      name: "Claude 3 Sonnet",
      provider: "Anthropic",
      isFree: false,
      inputCostPer1M: 3,
      outputCostPer1M: 15,
      contextWindow: 200000,
      description: "Balanced performance and cost for complex tasks",
    },
    {
      id: "anthropic/claude-3-opus",
      name: "Claude 3 Opus",
      provider: "Anthropic",
      isFree: false,
      inputCostPer1M: 15,
      outputCostPer1M: 75,
      contextWindow: 200000,
      description: "Anthropic's most powerful model for demanding tasks",
    },
  
    // Paid models - Mistral
    {
      id: "mistralai/mistral-large",
      name: "Mistral Large",
      provider: "Mistral AI",
      isFree: false,
      inputCostPer1M: 2,
      outputCostPer1M: 6,
      contextWindow: 32768,
      description: "Mistral's flagship model with strong reasoning",
    },
    {
      id: "mistralai/mistral-small",
      name: "Mistral Small",
      provider: "Mistral AI",
      isFree: false,
      inputCostPer1M: 0.2,
      outputCostPer1M: 0.6,
      contextWindow: 32768,
      description: "Efficient model for everyday tasks",
    },
  
    // Paid models - Other
    {
      id: "meta-llama/llama-3-70b-instruct",
      name: "Llama 3 70B",
      provider: "Meta",
      isFree: false,
      inputCostPer1M: 1,
      outputCostPer1M: 3,
      contextWindow: 8192,
      description: "Meta's largest Llama 3 model with strong capabilities",
    },
    {
      id: "google/gemini-pro",
      name: "Gemini Pro",
      provider: "Google",
      isFree: false,
      inputCostPer1M: 0.5,
      outputCostPer1M: 1.5,
      contextWindow: 32768,
      description: "Google's versatile model for various tasks",
    },
  ]
  
  // Helper function to get a model by ID
  export function getModelById(id: string): OpenRouterModel | undefined {
    return openRouterModels.find((model) => model.id === id)
  }
  
  // Helper function to get free models
  export function getFreeModels(): OpenRouterModel[] {
    return openRouterModels.filter((model) => model.isFree)
  }
  
  // Helper function to get paid models
  export function getPaidModels(): OpenRouterModel[] {
    return openRouterModels.filter((model) => !model.isFree)
  }
  
  // Default model ID
  export const DEFAULT_MODEL_ID = "anthropic/claude-3-haiku"
  
  