import { NextResponse } from "next/server"

export async function GET() {
  return NextResponse.json({
    openaiKeyAvailable: !!process.env.OPENAI_API_KEY,
    // Don't return the actual key for security reasons
    message: process.env.OPENAI_API_KEY ? "OpenAI API key is configured" : "OpenAI API key is missing",
  })
}

