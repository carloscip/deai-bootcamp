"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import type { Character } from "@/lib/types"

interface StoryFormProps {
  characters: Character[]
  onGenerateStory: (title: string, prompt: string) => Promise<void>
  isGenerating: boolean
}

export function StoryForm({ characters, onGenerateStory, isGenerating }: StoryFormProps) {
  const [title, setTitle] = useState("")
  const [customPrompt, setCustomPrompt] = useState("")
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    try {
      await onGenerateStory(title, customPrompt)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred while generating the story")
    }
  }

  // Generate a default prompt based on characters
  const generateDefaultPrompt = () => {
    if (characters.length === 0) {
      return "Generate an inspirational story about social change, collective action, and cultural shifts driven by web3 principles. The story should highlight how decentralized technologies can empower communities and create positive societal impact."
    }

    const characterDescriptions = characters
      .map((char) => `${char.name}: ${char.description}. Personality: ${char.personality}`)
      .join("\n")

    return `Generate an inspirational story about social change, collective action, and cultural shifts driven by web3 principles. The story should include the following characters:\n\n${characterDescriptions}\n\nThe story should highlight how these characters work together using decentralized technologies to empower communities and create positive societal impact. Each character should play a meaningful role in the narrative.`
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Story Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a title for your story"
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="prompt">Customize Prompt (Optional)</Label>
        <Textarea
          id="prompt"
          value={customPrompt}
          onChange={(e) => setCustomPrompt(e.target.value)}
          placeholder={generateDefaultPrompt()}
          className="min-h-[150px]"
        />
        <p className="text-sm text-muted-foreground">
          Customize the prompt or leave blank to use the default prompt with your characters.
        </p>
      </div>
      <Button type="submit" disabled={isGenerating || !title}>
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Generating Story...
          </>
        ) : (
          "Generate Story"
        )}
      </Button>
    </form>
  )
}

