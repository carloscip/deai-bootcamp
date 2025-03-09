import os
from dotenv import load_dotenv

load_dotenv()

# API Configuration
OPENAI_BASE_URL = "https://openrouter.ai/api/v1"
OPENAI_API_KEY = os.getenv("API_KEY")
OPENAI_DEFAULT_HEADERS = {
    "HTTP-Referer": "http://de-ai-course",
    "X-Title": "DeAI-Course",
}

STABILITY_API_URL = (
    "https://api.stability.ai/v1/generation/"
    "stable-diffusion-xl-1024-v1-0/text-to-image"
)
STABILITY_API_KEY = os.getenv("STABILITY_KEY")

# UI Constants
MAX_HISTORY_DISPLAY = 3
QUESTION_PREVIEW_LENGTH = 27
ANSWER_PREVIEW_LENGTH = 37
ASCII_WIDTH = 80


def create_system_messages():
    """Create the initial system messages for the chef assistant."""
    return [
        {
            "role": "system",
            "content": (
                """Your client is going to ask for a recipe about 
                a specific dish. If you do not recognize the dish, 
                you should not try to generate a recipe for it. 
                Do not answer a recipe if you do not understand the name of the dish. 
                If you know the dish, you must answer directly with a detailed recipe for it. 
                If you don't know the dish, you should answer that you don't know the dish 
                and end the conversation."""
            ),
        },
        {
            "role": "system",
            "content": (
                "When analyzing cooking instructions, you should: \n"
                "1. Check completeness and clarity\n"
                "2. Identify potential issues\n"
                "3. Suggest improvements\n"
                "4. Provide specific tips\n"
                "5. Enhance basic instructions with proper measurements"
            ),
        },
        {
            "role": "system",
            "content": (
                "Respond in these ways:\n"
                "1. Suggest dishes from ingredients\n"
                "2. Provide specific recipes\n"
                "3. Analyze cooking instructions\n"
                "4. Suggest recipe modifications\n"
                "Format in markdown with proper measurements and timing."
            ),
        },
    ]
