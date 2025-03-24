"use server"

import { generateText } from "ai"
import { openai, createOpenAI } from "@ai-sdk/openai"
import type { Character, Story } from "@/lib/types"

interface ApiSettings {
  useCustomEndpoint: boolean
  customApiUrl: string
  apiKey: string
}

export async function generateStory(
  title: string,
  characters: Character[],
  apiSettings: ApiSettings | null,
  customPrompt?: string,
): Promise<Story> {
  try {
    // Create the prompt based on characters or use custom prompt
    let prompt = customPrompt || ""

    if (!prompt) {
      if (characters.length === 0) {
        prompt =
          "Generate an inspirational story about social change, collective action, and cultural shifts driven by web3 principles. The story should highlight how decentralized technologies can empower communities and create positive societal impact."
      } else {
        const characterDescriptions = characters
          .map((char) => `${char.name}: ${char.description}. Personality: ${char.personality}`)
          .join("\n")

        prompt = `Generate an inspirational story about social change, collective action, and cultural shifts driven by web3 principles. The story should include the following characters:\n\n${characterDescriptions}\n\nThe story should highlight how these characters work together using decentralized technologies to empower communities and create positive societal impact. Each character should play a meaningful role in the narrative.`
      }
    }

    // Configure the AI model based on settings
    let model

    if (apiSettings?.useCustomEndpoint && apiSettings?.customApiUrl) {
      // Use custom API endpoint
      // Ensure the URL doesn't end with a trailing slash
      const baseURL = apiSettings.customApiUrl.endsWith("/")
        ? apiSettings.customApiUrl.slice(0, -1)
        : apiSettings.customApiUrl

      const customOpenAI = createOpenAI({
        baseURL,
        apiKey: apiSettings.apiKey || process.env.OPENAI_API_KEY || "",
      })

      model = customOpenAI("gpt-3.5-turbo")
    } else {
      // Use default OpenAI
      model = openai("gpt-3.5-turbo")
    }

    // Generate the story
    const { text: storyContent } = await generateText({
      model,
      prompt,
      maxTokens: 2000,
    })

    // Generate character summaries
    const characterSummaries: Record<string, string> = {}

    if (characters.length > 0) {
      for (const character of characters) {
        const summaryPrompt = `Based on the following story, summarize the role and impact of the character "${character.name}" in the narrative. Focus on how they contributed to the social change, collective action, or cultural shifts described in the story. Keep the summary concise (2-3 sentences).\n\nStory:\n${storyContent}`

        const { text: summary } = await generateText({
          model,
          prompt: summaryPrompt,
          maxTokens: 200,
        })

        characterSummaries[character.id] = summary
      }
    }

    // Create and return the story object
    return {
      id: crypto.randomUUID(),
      title,
      content: storyContent,
      characters,
      characterSummaries,
      createdAt: new Date(),
    }
  } catch (error) {
    console.error("Story generation error:", error)
    throw new Error(`Failed to generate story: ${error instanceof Error ? error.message : String(error)}`)
  }
}

