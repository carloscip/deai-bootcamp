"use client"

import { useState, useEffect } from "react"
import type { Story } from "@/lib/types"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import { StoryDisplay } from "@/components/story-display"
import { Footer } from "@/components/footer"

export default function StoryPage() {
  const params = useParams()
  const router = useRouter()
  const [story, setStory] = useState<Story | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storyId = params.id as string
    const savedStories = localStorage.getItem("stories")

    if (savedStories) {
      // Parse the JSON and convert date strings back to Date objects
      const parsedStories = JSON.parse(savedStories).map((story: any) => ({
        ...story,
        createdAt: new Date(story.createdAt),
      }))

      const foundStory = parsedStories.find((s: Story) => s.id === storyId)

      if (foundStory) {
        setStory(foundStory)
      } else {
        // Story not found, redirect to stories page
        router.push("/stories")
      }
    } else {
      // No stories saved, redirect to stories page
      router.push("/stories")
    }

    setLoading(false)
  }, [params.id, router])

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen">
        <div className="container py-8 flex-1">
          <div className="flex items-center justify-center p-12">
            <p>Loading story...</p>
          </div>
        </div>
        <Footer />
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <div className="container py-8 flex-1">
        <div className="mb-8">
          <Link href="/stories">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Stories
            </Button>
          </Link>
        </div>

        <StoryDisplay story={story} />
      </div>
      <Footer />
    </div>
  )
}

