export interface Character {
  id: string
  name: string
  description: string
  personality: string
}

export interface Story {
  id: string
  title: string
  content: string
  characters: Character[]
  characterSummaries: Record<string, string>
  createdAt: Date
}

