"use client"

import { useState, useEffect } from "react"
import type { Story } from "@/lib/types"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Footer } from "@/components/footer"

export default function StoriesPage() {
  const [stories, setStories] = useState<Story[]>([])

  useEffect(() => {
    const savedStories = localStorage.getItem("stories")
    if (savedStories) {
      // Parse the JSON and convert date strings back to Date objects
      const parsedStories = JSON.parse(savedStories).map((story: any) => ({
        ...story,
        createdAt: new Date(story.createdAt),
      }))
      setStories(parsedStories)
    }
  }, [])

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

        <h1 className="text-3xl font-bold mb-8">Your Stories</h1>

        {stories.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {stories.map((story) => (
              <Card key={story.id}>
                <CardHeader>
                  <CardTitle>{story.title}</CardTitle>
                  <CardDescription>Created on {story.createdAt.toLocaleDateString()}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="line-clamp-3 text-sm text-muted-foreground">{story.content.substring(0, 150)}...</p>
                </CardContent>
                <CardFooter>
                  <Link href={`/stories/${story.id}`}>
                    <Button variant="outline" size="sm">
                      Read Story
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center p-12 border rounded-lg bg-muted/50">
            <p className="text-muted-foreground mb-4">You haven't created any stories yet</p>
            <Link href="/generate">
              <Button>Create Your First Story</Button>
            </Link>
          </div>
        )}
      </div>
      <Footer />
    </div>
  )
}

