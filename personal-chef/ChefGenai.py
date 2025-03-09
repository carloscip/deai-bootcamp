import os
from google import genai
from dotenv import load_dotenv
import re

load_dotenv()

# Initialize the GenAI client
client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

# Select the GenAI model
model_name = 'gemini-2.0-flash'

# System messages (Carlos)
system_message1 = (
    "You are Carlos, an Argentinian chef in his 40s, and a die-hard Boca Juniors fan. "
    "Every weekend, you get together with your friends to grill 'asado' and drink beer. "
    "Your grandfather taught you how to make 'asado' at the age of 8 on the family farm, and you're an expert in sausages and pork cuts. "
    "However, you also know a lot about other Argentinian dishes, like empanadas, locro, humita, and traditional stews. "
    "You use a lot of spices and always like to experiment with new things in the kitchen. "
    "When you speak, you use Argentinian slang like 'che', 'boludo', 'dale', '¡Aguante Boca!', and you refer to your clients as 'pibe' (dude) or 'mina' (chick). "
    "You always answer with good vibes. For you, Messi and Maradona are the two best soccer players of all time."
)

system_message2 = (
    "Your task is to assist users in the following ways, understanding their intent even if they don't use specific keywords:\n"
    "1. **Ingredient-based dish suggestions:** If the user seems to be providing a list of ingredients, or asking what they can make with certain ingredients, suggest Argentinian dishes that can be made with those ingredients. The user might simply list the ingredients, or ask a question like 'What can I cook with these?' or 'Any ideas with these?' Provide only the names of the dishes.\n"
    "2. **Recipe requests:** If the user wants a recipe for a specific dish, provide a detailed Argentinian recipe, including ingredients, instructions, and cooking tips. The user might ask directly for the recipe, or express a desire to know how to make the dish. However, you are an expert in Argentinian cuisine, especially asado and grilled dishes. If the user asks for a recipe that is clearly outside of Argentinian cuisine or your area of expertise (e.g., a complex French soup, a delicate Japanese dessert), politely decline and say something like 'Che, eso no es lo mío. I'm more of an asado guy, you know?'\n"
    "3. **Recipe critiques:** If the user provides a recipe (or expresses the intention of providing a recipe), analyze the recipe. Check if it's complete and clear, identify potential issues, and suggest improvements, such as Argentinian spices or better cuts of meat. You cannot critique a recipe without seeing it first!"
)

system_message3 = (
    "When interacting with the user, prioritize understanding their intent. Try to infer what they want to do, even if they don't express it directly. Respond in a way that matches their intent, using the appropriate tone and style. If you're unsure about the user's intent, ask them to clarify."
)

# Create a chat session
chat = client.chats.create(model=model_name)

# Send the system messages as the first message
system_prompt = f"{system_message1}\n{system_message2}\n{system_message3}"
response = chat.send_message(message=system_prompt)

# Function to determine the type of request and respond accordingly
def handle_user_request(user_input):
    user_input = user_input.lower()

    # Delegate intent detection to the model
    prompt = (
        f"Given the following input: '{user_input}', determine what the user wants. "
        f"Are they asking for a recipe, providing ingredients, or asking for a critique of a recipe? "
        f"Respond with one of the following: 'recipe', 'ingredients', 'critique', or 'unknown'."
    )
    response = chat.send_message(message=prompt)
    intent = response.text.lower()

    if "recipe" in intent:
        # Check if it's the kind of recipe Carlos would cook
        check_prompt = f"As Carlos, an Argentinian chef, does '{user_input}' have elements that could be considered Argentinian or related to your expertise? Answer 'yes' or 'no'."
        check_response = chat.send_message(message=check_prompt)

        if "no" in check_response.text.lower():
            return "Che, boludo, that's not really my style. I stick to Argentinian stuff, you know? Maybe try asking someone who knows more about that kind of food."

        # Provide a detailed recipe
        return get_recipe(user_input)

    elif "ingredients" in intent:
        # Suggest dishes based on ingredients
        return suggest_dishes(user_input)

    elif "critique" in intent:
        # Analyze and critique a recipe
        return critique_recipe(user_input)

    else:
        # Default response if the request is not recognized
        return "Che, pibe/mina, I didn't quite get what you need. Do you want me to suggest a dish based on ingredients, give you a recipe, or critique one?"

# Function to suggest dishes based on ingredients
def suggest_dishes(ingredients):
    # Logic to suggest Argentinian dishes based on ingredients (only names)
    prompt = f"What Argentinian dishes can I make with these ingredients: {ingredients}?"
    response = chat.send_message(message=prompt)
    return response.text

def get_recipe(dish):
    # Logic to get and format the detailed recipe
    prompt = f"Give me a detailed Argentinian recipe for {dish}, including ingredients, instructions, and cooking tips."
    response = chat.send_message(message=prompt)
    return response.text

def critique_recipe(recipe):
    # Logic to analyze the recipe and give suggestions
    prompt = (
        "Che, you want me to critique a recipe? Here it is: '" + recipe + "'\n"
        "From an Argentinian chef's perspective, tell me what's missing, what's not clear, what could be improved, what ingredients are missing, and what this recipe needs to make it truly authentic and delicious. Don't repeat the recipe, just give me your critique and suggestion!"
    )
    response = chat.send_message(message=prompt)
    return response.text

# Main conversation loop
try:
    while True:
        user_input = input("Che, what do you need? (ingredients, recipe for [dish], critique [recipe], or 'exit' to quit):\n")

        if user_input.lower() == 'exit':
            break

        response = handle_user_request(user_input)
        print(response)

except Exception as e:
    print(f"¡Upa! Something went wrong: {e}")