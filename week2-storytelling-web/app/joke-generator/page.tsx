import { JokeGenerator } from "@/components/joke-generator"

export default function JokeGeneratorPage() {
  return (
    <div className="container mx-auto py-10 px-4">
      <h1 className="text-4xl font-bold text-center mb-8">AI Joke Generator</h1>
      <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
        Customize your joke parameters and let AI create a personalized joke just for you. Our AI will also evaluate the
        joke's humor, appropriateness, and more!
      </p>
      <JokeGenerator />
    </div>
  )
}

