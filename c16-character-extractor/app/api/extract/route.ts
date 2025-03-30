import { NextResponse } from 'next/server';
import { OpenAI } from 'llamaindex';

export async function POST(request: Request) {
  try {
    const { text } = await request.json();

    const llm = new OpenAI({
      model: 'gpt-3.5-turbo',
      temperature: 0.1,
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `Analiza el siguiente texto y extrae los personajes principales. Para cada personaje, proporciona:
    1. Nombre
    2. Descripción física y/o contextual
    3. Rasgos de personalidad

    Formato de respuesta esperado (JSON):
    [
      {
        "name": "Nombre del personaje",
        "description": "Descripción física y contextual",
        "personality": "Rasgos de personalidad"
      }
    ]

    Texto a analizar:
    ${text}`;

    const response = await llm.complete({
      prompt,
      stream: false,
    });

    const characters = JSON.parse(response.text);
    return NextResponse.json(characters);
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Error al procesar los personajes del texto' },
      { status: 500 }
    );
  }
} 