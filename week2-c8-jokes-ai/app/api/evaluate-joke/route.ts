import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { eval_system_prompt } from './config.prompts';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { joke, topic, tone, type } = await request.json();

    const completion = await openai.chat.completions.create({
      messages: [
        { role: "system", content: eval_system_prompt },
        {
          role: "user",
          content: `Evaluate the following joke:
          
Topic: ${topic}
Tone: ${tone}
Type: ${type}
Joke: ${joke}

Evaluate this joke on the following criteria:
1. Funny (1-10 scale)
2. Appropriate (1-10 scale)
3. Offensive (1-10 scale)
4. Provide a brief explanation of your ratings.`
        }
      ],
      model: "gpt-3.5-turbo",
      response_format: { type: "json_object" },
      temperature: 0.2,
    });
    
    const result = JSON.parse(completion.choices[0].message.content || '{}');

    return NextResponse.json({
      funnyScore: result.funnyScore || 5,
      appropriateScore: result.appropriateScore || 5,
      offensiveScore: result.offensiveScore || 5,
      explanation: result.explanation || "No explanation provided."
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json(
      { error: 'Failed to evaluate joke' },
      { status: 500 }
    );
  }
}