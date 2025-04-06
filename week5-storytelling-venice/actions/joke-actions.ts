"use server"

import type { JokeFormValues, JokeResult } from "@/types/joke-types"
import { getModelById } from "@/lib/available-models"

// Direct API call to Venice
async function callVenice(messages: any[], modelId: string, temperature = 0.7, maxTokens = 500) {
  const apiKey = process.env.VENICE_API_KEY
  if (!apiKey) {
    throw new Error("Venice API key is not configured")
  }

  const response = await fetch("https://api.venice.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://v0.dev", // Required for Venice
      "X-Title": "AI Joke Generator", // Optional but recommended
    },
    body: JSON.stringify({
      model: modelId,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Venice API error: ${response.status} ${errorText}`)
  }

  return await response.json()
}

export async function generateJoke(params: JokeFormValues): Promise<JokeResult> {
  try {
    // Check if API key is available
    if (!process.env.VENICE_API_KEY) {
      throw new Error("Venice API key is not configured. Please add VENICE_API_KEY to your .env.local file.")
    }

    // Get model information
    const modelInfo = getModelById(params.modelId)
    if (!modelInfo) {
      throw new Error(`Unknown model ID: ${params.modelId}`)
    }

    // Generate the joke
    const jokePrompt = createJokePrompt(params)
    const jokeMessages = [
      { role: "system", content: "You are a professional comedian who creates jokes based on user specifications." },
      { role: "user", content: jokePrompt },
    ]

    const jokeResponse = await callVenice(jokeMessages, params.modelId, params.temperature, 500)

    const jokeContent = jokeResponse.choices[0].message.content

    // Use a smaller model for evaluation to save costs
    const evaluationModelId = "anthropic/claude-3-haiku"

    // Evaluate the joke
    const evaluation = await evaluateJoke(jokeContent, params, evaluationModelId)

    return {
      content: jokeContent,
      parameters: params,
      evaluation,
      modelInfo: modelInfo
        ? {
            name: modelInfo.name,
            provider: modelInfo.provider,
            inputCost: modelInfo.inputCostPer1M,
            outputCost: modelInfo.outputCostPer1M,
          }
        : undefined,
    }
  } catch (error) {
    console.error("Error generating joke:", error)
    return {
      content: "Failed to generate joke. Please check your API key configuration.",
      parameters: params,
      evaluation: {
        humorLevel: "N/A",
        appropriateness: "N/A",
        originality: "N/A",
        feedback: "An error occurred: " + (error instanceof Error ? error.message : String(error)),
      },
    }
  }
}

// Calculate token cost based on complexity
export async function calculateQueryCost(params: JokeFormValues): Promise<number> {
  // Base cost for any joke
  let baseCost = 3;

  // Add cost based on joke type
  switch (params.type) {
    case "long":
      baseCost += 2;
      break;
    case "short":
      // No change to base cost for short jokes
      break;
    case "one-liner":
      baseCost -= 1;
      break;
    default:
      // Default is short joke
      break;
  }

  // Add cost for higher temperature (more creativity)
  baseCost += Math.round(params.temperature * 2);

  // Return cost in whole tokens
  return Math.max(Math.ceil(baseCost), 1); // Ensure minimum cost is 1 token
}

function createJokePrompt(params: JokeFormValues): string {
  const { topic, tone, type } = params

  return `Create a ${tone} ${type} joke about ${topic}. 
  The joke should be entertaining and match the requested tone.
  Only return the joke text without any additional commentary or explanation.`
}

async function evaluateJoke(
  jokeContent: string,
  params: JokeFormValues,
  evaluationModelId: string,
): Promise<{
  humorLevel: string
  appropriateness: string
  originality: string
  feedback: string
}> {
  const evaluationPrompt = `
  Analyze the following joke and provide an evaluation:
  
  Joke: "${jokeContent}"
  
  Parameters used to generate this joke:
  - Topic: ${params.topic}
  - Tone: ${params.tone}
  - Type: ${params.type}
  
  Evaluate the joke on these criteria:
  1. Humor Level (Hilarious, Funny, Amusing, Mild, or Flat)
  2. Appropriateness (Family-friendly, Appropriate, Edgy, Inappropriate, or Offensive)
  3. Originality (Brilliant, Original, Decent, Common, or Cliché)
  
  Also provide a brief feedback comment (1-2 sentences) on the joke.
  
  Format your response as a JSON object with the following structure:
  {
    "humorLevel": "one of the options above",
    "appropriateness": "one of the options above",
    "originality": "one of the options above",
    "feedback": "your brief feedback"
  }
  
  Only return the JSON object, nothing else.
  `

  try {
    const evaluationMessages = [
      { role: "system", content: "You are an expert joke evaluator who provides structured feedback." },
      { role: "user", content: evaluationPrompt },
    ]

    const evaluationResponse = await callVenice(evaluationMessages, evaluationModelId, 0.5, 300)

    const evaluationText = evaluationResponse.choices[0].message.content

    try {
      return JSON.parse(evaluationText)
    } catch (parseError) {
      console.error("Error parsing evaluation:", parseError)
      // Fallback evaluation if parsing fails
      return {
        humorLevel: "Amusing",
        appropriateness: "Appropriate",
        originality: "Decent",
        feedback: "This joke meets the requested parameters.",
      }
    }
  } catch (error) {
    console.error("Error generating evaluation:", error)
    // Fallback evaluation if API call fails
    return {
      humorLevel: "Amusing",
      appropriateness: "Appropriate",
      originality: "Decent",
      feedback: "Unable to properly evaluate this joke: " + (error instanceof Error ? error.message : String(error)),
    }
  }
}

