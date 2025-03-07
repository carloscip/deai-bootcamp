# Personal Chef AI Assistant

An interactive command-line AI chef assistant that helps you with recipes, cooking instructions, and food-related questions. The assistant can provide detailed recipes, analyze cooking instructions, suggest improvements, and even generate appetizing images of the dishes!

## Features

- 👨‍🍳 Interactive conversation with an AI chef
- 📝 Detailed recipe suggestions and cooking instructions
- 🔍 Analysis and improvement of cooking methods
- 🖼️ AI-generated food images using Stability AI
- 📜 Conversation history with easy navigation
- 🎨 Beautiful terminal UI with ASCII art previews

## Prerequisites

- Python 3.8 or higher
- OpenRouter API key (for AI chat)
- Stability AI API key (for image generation)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/carloscip/deai-bootcamp.git
cd personal-chef
```

2. Create a virtual environment and activate it:
```bash
python -m venv venv
source venv/bin/activate  # On Windows, use: venv\Scripts\activate
```

3. Install the required packages:
```bash
pip install -r requirements.txt
```

4. Create a `.env` file in the project root with your API keys:
```bash
API_KEY=your_openrouter_api_key
STABILITY_KEY=your_stability_ai_key # OPTIONAL
```

## Environment Variables

- `API_KEY`: Your OpenRouter API key for accessing GPT models. You can also use an openai key instead.
- `STABILITY_KEY`: Your Stability AI API key for image generation (optional)

## Usage

Run the application:
```bash
python main.py
```

The assistant will start in interactive mode. You can:
- Ask questions about recipes
- Request cooking instructions
- Get feedback on your cooking methods
- View previous conversations by entering their number
- Exit the application with Ctrl+C

## Project Structure

The project is organized into four main files:

### `main.py`
The entry point of the application. It initializes the terminal UI and starts the main application loop.

### `config.py`
Contains all configuration settings and system messages:
- API endpoints and authentication
- UI constants
- System messages that define the AI assistant's behavior

### `clients.py`
Handles all external API interactions:
- OpenAI chat completions for recipe generation and cooking advice
- Stability AI integration for food image generation
- Error handling and response processing

### `terminal_ui.py`
Manages the terminal user interface:
- Rich text formatting and display
- User input handling
- Conversation history management
- ASCII art generation for images
- Temporary file management

## Notes

- Image generation is optional and will be skipped if no Stability AI API key is provided
- The application stores conversation history in memory during the session
- Temporary image files are automatically cleaned up when the application exits
- The UI is optimized for terminal displays with color support

## Error Handling

The application includes robust error handling for:
- API failures
- Network issues
- Invalid user inputs
- Image generation problems
- File system operations

## Contributing

Feel free to submit issues, fork the repository, and create pull requests for any improvements. 