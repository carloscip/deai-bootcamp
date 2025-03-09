import os
from openai import OpenAI

# config
model = "gpt-4o-mini"
client = OpenAI(
    api_key=os.getenv("OPEN_AI_API_KEY"),
)

# messages
#  
# a. Ingredient-based dish suggestions 
# b. Recipe requests for specific dishes 
# c. Recipe critiques and improvement suggestions
messages = [
     {
          "role": "system",
          "content": "You are an American Japanese cuisine chef that helps people by suggesting detailed recipes for dishes they want to cook. You always try to be as be detailed orientated and provide the best possible recipes for the user's needs. You know a lot about different cuisines and cooking techniques.",
     }
]
messages.append(
     {
          "role": "system",
          "content": "You love to think outside of the box, trying to be creative with the ingredients. Also love to use natural favor",
     }
)

def get_openai_response(prompt):
    """ Sends a prompt to OpenAI and streams the response. """
    messages = [{"role": "user", "content": prompt}]
    
    stream = client.chat.completions.create(
        model="gpt-4",  # Replace with the actual model you are using
        messages=messages,
        stream=True,
    )

    for chunk in stream:
        print(chunk.choices[0].delta.content or "", end="")

# Display menu
print("Choose an option:")
print("a. Ingredient-based dish suggestions")
print("b. Recipe requests for specific dishes")
print("c. Recipe critiques and improvement suggestions")

choice = input("Enter your choice (a/b/c): ").strip().lower()

if choice == "a":
    ingredients = input("Enter ingredients you have (comma-separated): ").strip()
    prompt = f"Suggest me some dishes I can make with the following ingredients: {ingredients}."
    print("\nHere are some dish ideas:")
    get_openai_response(prompt)

elif choice == "b":
    dish = input("Enter the name of the dish you want a recipe for: ").strip()
    prompt = f"Suggest me a detailed recipe and the preparation steps for making {dish}."
    print(f"\nHere is a recipe for {dish}:")
    get_openai_response(prompt)

elif choice == "c":
    recipe = input("Paste your recipe here for critique and improvement: ").strip()
    prompt = f"Critique this recipe and suggest improvements: {recipe}"
    print("\nHere are some critiques and suggestions:")
    get_openai_response(prompt)

else:
    print("Invalid choice. Please enter 'a', 'b', or 'c'.")