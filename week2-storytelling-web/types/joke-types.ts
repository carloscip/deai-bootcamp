export interface JokeFormValues {
  topic: string
  tone: string
  type: string
  temperature: number
  modelId: string
}

export interface JokeEvaluation {
  humorLevel: string
  appropriateness: string
  originality: string
  feedback: string
}

export interface JokeResult {
  content: string
  parameters: JokeFormValues
  evaluation: JokeEvaluation
  modelInfo?: {
    name: string
    provider: string
    inputCost: number
    outputCost: number
  }
}

