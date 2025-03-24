"use client"

import { useState, useEffect } from "react"
import { CharacterTable } from "@/components/character-table"
import { StoryForm } from "@/components/story-form"
import { StoryDisplay } from "@/components/story-display"
import type { Character, Story } from "@/lib/types"
import { generateStory } from "@/lib/actions"
import { v4 as uuidv4 } from "uuid"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { useSettings } from "@/lib/settings-context"
import { Footer } from "@/components/footer"
import { useToast } from "@/hooks/use-toast"

export function GeneratePageContent() {
  const [characters, setCharacters] = useState<Character[]>([])
  const [story, setStory] = useState<Story | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [activeTab, setActiveTab] = useState("characters")
  const { apiSettings } = useSettings()
  const { toast } = useToast()

  // Load characters from localStorage on component mount
  useEffect(() => {
    const savedCharacters = localStorage.getItem("characters")
    if (savedCharacters) {
      setCharacters(JSON.parse(savedCharacters))
    }
  }, [])

  // Save characters to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("characters", JSON.stringify(characters))
  }, [characters])

  const handleAddCharacter = (newCharacter: Omit<Character, "id">) => {
    const characterWithId = {
      ...newCharacter,
      id: uuidv4(),
    }
    setCharacters([...characters, characterWithId])
  }

  const handleUpdateCharacter = (updatedCharacter: Character) => {
    setCharacters(characters.map((char) => (char.id === updatedCharacter.id ? updatedCharacter : char)))
  }

  const handleDeleteCharacter = (id: string) => {
    setCharacters(characters.filter((char) => char.id !== id))
  }

  const handleGenerateStory = async (title: string, customPrompt: string) => {
    setIsGenerating(true)
    try {
      const generatedStory = await generateStory(title, characters, apiSettings, customPrompt)
      setStory(generatedStory)
      setActiveTab("story")

      // Save story to localStorage
      const savedStories = JSON.parse(localStorage.getItem("stories") || "[]")
      localStorage.setItem("stories", JSON.stringify([...savedStories, generatedStory]))
    } catch (error) {
      console.error("Error generating story:", error)
      toast({
        title: "Error generating story",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container py-8 flex-1">
        <div className="mb-8">
          <Link href="/">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <h1 className="text-3xl font-bold mb-8">Create Your Inspirational Story</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-8">
            <TabsTrigger value="characters">Characters</TabsTrigger>
            <TabsTrigger value="generate">Generate Story</TabsTrigger>
            <TabsTrigger value="story" disabled={!story}>
              View Story
            </TabsTrigger>
          </TabsList>

          <TabsContent value="characters" className="space-y-8">
            <CharacterTable
              characters={characters}
              onAddCharacter={handleAddCharacter}
              onUpdateCharacter={handleUpdateCharacter}
              onDeleteCharacter={handleDeleteCharacter}
            />
          </TabsContent>

          <TabsContent value="generate" className="space-y-8">
            <StoryForm characters={characters} onGenerateStory={handleGenerateStory} isGenerating={isGenerating} />
          </TabsContent>

          <TabsContent value="story" className="space-y-8">
            <StoryDisplay story={story} />
          </TabsContent>
        </Tabs>
      </div>
      <Footer />
    </div>
  )
}

