import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { messages_prompts } from './config.propts';
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { topic, tone, type, temperature, language } = await request.json();

    const prompt = `Generate a ${tone} ${type} joke about ${topic} in ${language}. The joke should be appropriate for a general audience.`;

    const completion = await openai.chat.completions.create({
      messages: [
        ...messages_prompts,
        {
          role: "user",
          content: prompt
        }
      ],
      model: "gpt-3.5-turbo",
      temperature: temperature,
    });
    
    const joke = completion.choices[0].message.content;

    return NextResponse.json({ joke });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to generate joke' },
      { status: 500 }
    );
  }
} 