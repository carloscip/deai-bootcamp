interface Character {
  name: string;
  description: string;
  personality: string;
}

export async function extractCharacters(text: string): Promise<Character[]> {
  const response = await fetch('/api/extract', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!response.ok) {
    throw new Error('Error al procesar los personajes del texto');
  }

  return response.json();
} 