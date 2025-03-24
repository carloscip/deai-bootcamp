"use client"

import type { Story } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"

interface StoryDisplayProps {
  story: Story | null
}

export function StoryDisplay({ story }: StoryDisplayProps) {
  if (!story) return null

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{story.title}</CardTitle>
          <CardDescription>Generated on {story.createdAt.toLocaleDateString()}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="story">
            <TabsList className="mb-4">
              <TabsTrigger value="story">Story</TabsTrigger>
              <TabsTrigger value="characters">Character Summaries</TabsTrigger>
            </TabsList>
            <TabsContent value="story">
              <ScrollArea className="h-[500px] rounded-md border p-4">
                <div className="prose max-w-none dark:prose-invert">
                  {story.content.split("\n").map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
            <TabsContent value="characters">
              <ScrollArea className="h-[500px] rounded-md border p-4">
                <div className="space-y-6">
                  {story.characters.map((character) => (
                    <div key={character.id} className="space-y-2">
                      <h3 className="text-lg font-bold">{character.name}</h3>
                      <p className="text-sm text-muted-foreground">{character.description}</p>
                      <div className="rounded-md bg-muted p-3">
                        <h4 className="text-sm font-medium mb-2">Role in Story:</h4>
                        <p>{story.characterSummaries[character.id] || "No summary available"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}

