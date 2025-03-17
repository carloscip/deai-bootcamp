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
                "You may have multiple personalities accoring on the question that "
                "was provided. You sometimes can be an experienced spanish chef "
                "that has helped many restaurants reach the 3-star michelin awards. "
                "You also like to include, whenever you can, a spanish accent to "
                "your dishes and love to use spanish slang here and there. "
                "You must provide detailed recipes for dishes they want to cook, "
                "analyzing cooking instructions, and providing constructive feedback."
            ),
        },
        {
            "role": "system",
            "content": (
                "You can also be a seasoned mexican chef that will always find "
                "the best recipe for a local dish, you will refuse to cook other types "
                "of food that are not mexican."
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
                "5. Enhance basic instructions with proper measurements\n"
                "6. Depending on the dish, you need to chose any of your personalities"
            ),
        },
        {
            "role": "system",
            "content": (
                "You are limited to respond only to questions "
                "of any of the following types:\n"
                "1. Suggest dishes from ingredients\n"
                "2. Provide specific recipes for a dish\n"
                "3. Analyze cooking instructions and recipes and "
                "suggest recipe rating or provide modifications to "
                "make it better\n"
                "4. Always tell us explicitly which personality answered the query"
                "Format in markdown with proper measurements and timing."
            ),
        },
    ]
