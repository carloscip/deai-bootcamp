from openai import OpenAI
import requests
import tempfile
from PIL import Image
import io
import base64
from config import (
    OPENAI_API_KEY,
    OPENAI_BASE_URL,
    OPENAI_DEFAULT_HEADERS,
    STABILITY_API_URL,
    STABILITY_API_KEY,
)


class AIClients:
    def __init__(self):
        self.openai_client = OpenAI(
            base_url=OPENAI_BASE_URL,
            api_key=OPENAI_API_KEY,
            default_headers=OPENAI_DEFAULT_HEADERS,
        )

    def get_chat_response(self, messages, stream=True):
        """Get streaming response from OpenAI chat completion."""
        return self.openai_client.chat.completions.create(
            model="openai/gpt-4o-mini",
            messages=messages,
            stream=stream,
        )

    def generate_dish_image(self, dish_name):
        """Generate an image using Stability AI."""
        if not STABILITY_API_KEY:
            return None

        try:
            response = requests.post(
                STABILITY_API_URL,
                headers={
                    "Accept": "application/json",
                    "Authorization": f"Bearer {STABILITY_API_KEY}",
                },
                json={
                    "text_prompts": [
                        {
                            "text": (
                                f"Professional food photography of {dish_name}, "
                                "restaurant presentation, soft lighting, 4k"
                            )
                        }
                    ],
                    "cfg_scale": 7,
                    "steps": 30,
                    "width": 1024,
                    "height": 1024,
                },
            )

            if response.status_code != 200:
                raise Exception(f"API request failed: {response.text}")

            data = response.json()
            if "artifacts" in data and data["artifacts"]:
                image_data = data["artifacts"][0]["base64"]
                img = Image.open(io.BytesIO(base64.b64decode(image_data)))

                with tempfile.NamedTemporaryFile(
                    suffix=".png", delete=False
                ) as tmp_file:
                    img.save(tmp_file.name)
                    return tmp_file.name

        except Exception:
            return None
