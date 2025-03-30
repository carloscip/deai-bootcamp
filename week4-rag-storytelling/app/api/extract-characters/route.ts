import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Read the file content
    const text = await file.text();

    // Query to extract characters
    const query = `Extract all characters from this text. For each character, provide:
    1. Their name
    2. A brief description of their appearance and role
    3. Their personality traits and characteristics
    
    Format the response as a JSON array of objects with the following structure:
    {
      "characters": [
        {
          "name": "string",
          "description": "string",
          "personality": "string"
        }
      ]
    }`;

    const completion = await openai.chat.completions.create({
      model: process.env.MODEL ?? "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that extracts characters from text and formats them in a structured way."
        },
        {
          role: "user",
          content: `${query}\n\nText to analyze:\n${text}`
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const response = completion.choices[0].message.content;
    if (!response) {
      throw new Error('No response from OpenAI');
    }

    const characters = JSON.parse(response).characters;
    return NextResponse.json({ characters });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    );
  }
} 