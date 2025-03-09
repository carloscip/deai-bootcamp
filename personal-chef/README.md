# Personal Chef AI Assistant - GenAI Edition

An interactive command-line AI chef assistant that helps you with recipes, cooking instructions, and food-related questions. The assistant can provide detailed recipes and analyze cooking instructions, suggesting improvements.

## Features

- 👨‍🍳 Interactive conversation with an AI chef (Carlos, an Argentinian grill master!)
- 📝 Detailed recipe suggestions and cooking instructions
- 🔍 Analysis and improvement of cooking methods
- 🇦🇷 Argentinian culinary expertise, with a touch of Boca Juniors passion!

## Prerequisites

- Python 3.8 or higher (Make sure to select the correct version!)
- Google Cloud project with the Gemini API enabled
- Google Cloud API key (for GenAI access)

## Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/carloscip/deai-bootcamp.git
    cd deai-bootcamp
    ```

2.  **Navigate to the `genai` branch:**

    ```bash
    git checkout genai
    ```

3.  Create a virtual environment and activate it:

    ```bash
    python -m venv venv
    source .venv/bin/activate  # On Windows, use: venv\Scripts\activate
    ```

4.  Install the required packages:

    ```bash
    pip install google-genai
    pip install python-dotenv
    ```

    For other languages, please refer to the official documentation: [https://ai.google.dev/gemini-api/docs/downloads](https://ai.google.dev/gemini-api/docs/downloads)

5.  Create a `.env` file in the project root with your API key:

    ```
    GOOGLE_API_KEY=your_google_api_key
    ```

## Environment Variables

-   `GOOGLE_API_KEY`: Your Google Cloud API key for accessing the Gemini models via GenAI.

## Usage

Run the application:

```bash
python ChefGenai.py
```

The assistant will start in interactive mode. You can:

Ask questions about Argentinian recipes

Request cooking instructions

Get feedback on your cooking methods

Exit the application with exit

Project Structure
The project is organized as follows:

ChefGenai.py
This file contains the main logic for the AI chef assistant, including:

Initialization of the GenAI client

Definition of the system messages and prompts

Functions for handling different types of user requests (ingredients, recipes, critiques)

Main conversation loop

.env

This file stores your API key securely.

Contributing
Feel free to submit issues, fork the repository, and create pull requests for any improvements.