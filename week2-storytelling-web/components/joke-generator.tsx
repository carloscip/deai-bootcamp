"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { JokeDisplay } from "@/components/joke-display"
import { ModelSelector } from "@/components/model-selector"
import { generateJoke } from "@/actions/joke-actions"
import { topics, tones, jokeTypes } from "@/lib/joke-options"
import type { JokeFormValues, JokeResult } from "@/types/joke-types"
import { DEFAULT_MODEL_ID } from "@/lib/openrouter-models"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"

// Create a zod schema for form validation
const formSchema = z.object({
  topic: z.string(),
  tone: z.string(),
  type: z.string(),
  temperature: z.number().min(0.1).max(1),
  modelId: z.string(),
})

export function JokeGenerator() {
  const [joke, setJoke] = useState<JokeResult | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const form = useForm<JokeFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      topic: "general",
      tone: "witty",
      type: "short",
      temperature: 0.7,
      modelId: DEFAULT_MODEL_ID,
    },
  })

  async function onSubmit(data: JokeFormValues) {
    setIsGenerating(true)
    setError(null)

    try {
      const result = await generateJoke(data)

      // Check if there was an error in the joke generation
      if (
        result.content.includes("Failed to generate joke") ||
        result.evaluation.feedback.includes("An error occurred")
      ) {
        setError("Failed to generate joke. Please check your API key configuration.")
      }

      setJoke(result)
    } catch (error) {
      console.error("Failed to generate joke:", error)
      setError("An error occurred while generating the joke. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-2">
      {error && (
        <Alert variant="destructive" className="md:col-span-2">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Card>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="modelId"
                render={({ field }) => <ModelSelector value={field.value} onChange={field.onChange} />}
              />

              <FormField
                control={form.control}
                name="topic"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Topic</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a topic" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {topics.map((topic) => (
                          <SelectItem key={topic.value} value={topic.value}>
                            {topic.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Choose what the joke should be about</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tone</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a tone" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {tones.map((tone) => (
                          <SelectItem key={tone.value} value={tone.value}>
                            {tone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Set the mood and style of the joke</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Joke Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a joke type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {jokeTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Choose the structure of your joke</FormDescription>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="temperature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Creativity Level: {field.value.toFixed(1)}</FormLabel>
                    <FormControl>
                      <Slider
                        min={0.1}
                        max={1.0}
                        step={0.1}
                        value={[field.value]}
                        onValueChange={(values) => field.onChange(values[0])}
                      />
                    </FormControl>
                    <FormDescription>
                      Higher values make jokes more creative but potentially less coherent
                    </FormDescription>
                  </FormItem>
                )}
              />

              <Button type="submit" className="w-full" disabled={isGenerating}>
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Joke...
                  </>
                ) : (
                  "Generate Joke"
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <JokeDisplay joke={joke} isLoading={isGenerating} />
    </div>
  )
}

