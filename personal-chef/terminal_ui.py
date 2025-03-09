from rich.console import Console
from rich.markdown import Markdown
from rich.panel import Panel
from rich.table import Table
from rich.live import Live
from art import text2art
import numpy as np
from PIL import Image
import os
from config import (
    MAX_HISTORY_DISPLAY,
    QUESTION_PREVIEW_LENGTH,
    ANSWER_PREVIEW_LENGTH,
    ASCII_WIDTH,
    create_system_messages,
)
from clients import AIClients


class TerminalUI:
    def __init__(self):
        self.console = Console(color_system="truecolor")
        self.conversation_history = []
        self.messages = create_system_messages()
        self.temp_files = []
        self.ai_clients = AIClients()

    def truncate_text(self, text, max_length):
        """Truncate text with ellipsis if too long."""
        return text[: max_length - 3] + "..." if len(text) > max_length else text

    def display_history(self):
        """Display the conversation history in a compact format."""
        if not self.conversation_history:
            return

        table = Table(
            show_header=True,
            header_style="bold magenta",
            expand=True,
            show_lines=True,
        )
        table.add_column("#", style="dim")
        table.add_column("Previous Questions", style="cyan", max_width=30)
        table.add_column("Preview", style="green", max_width=40)

        start_idx = max(0, len(self.conversation_history) - MAX_HISTORY_DISPLAY)
        for i, (question, answer, _) in enumerate(
            self.conversation_history[start_idx:], start_idx + 1
        ):
            table.add_row(
                str(i),
                self.truncate_text(question, QUESTION_PREVIEW_LENGTH),
                self.truncate_text(answer, ANSWER_PREVIEW_LENGTH),
            )

        self.console.print(
            Panel(
                table,
                title="[yellow]Conversation History[/]",
                border_style="yellow",
            )
        )

    def image_to_ascii(self, image):
        """Convert image to ASCII art maintaining aspect ratio."""
        image = image.convert("L")
        target_height = ASCII_WIDTH // 2
        image = image.resize((ASCII_WIDTH, target_height))

        pixels = np.array(image)
        ASCII_CHARS = "@%#*+=-:. "[::-1]

        border_line = "+" + "-" * ASCII_WIDTH + "+\n"
        ascii_str = border_line

        for row in pixels:
            chars = [
                ASCII_CHARS[int(pixel / 255 * (len(ASCII_CHARS) - 1))] for pixel in row
            ]
            ascii_str += "|" + "".join(chars) + "|\n"

        ascii_str += border_line
        return ascii_str

    def display_conversation(self, question, answer, image_path=None):
        """Display a conversation with optional image."""
        self.console.print("\n[bold cyan]Question:[/]")
        self.console.print(Panel(question, border_style="cyan"))
        self.console.print("\n[bold blue]Answer:[/]")
        self.console.print(Panel(Markdown(answer), border_style="blue"))

        if image_path and os.path.exists(image_path):
            try:
                img = Image.open(image_path)
                ascii_art = self.image_to_ascii(img)
                self.console.print("\n[bold purple]Dish Image:[/]")
                self.console.print(
                    Panel(
                        f"[green]{ascii_art}[/]",
                        title="[bold]ASCII Preview[/]",
                        border_style="green",
                        expand=True,
                    )
                )
                self.console.print(
                    Panel(
                        "[blue]🖼 View full resolution image: "
                        f"[link=file://{image_path}]Click here[/link][/]",
                        border_style="blue",
                    )
                )
            except Exception as e:
                self.console.print(f"\n[red]Error displaying image: {str(e)}[/]")

    def show_previous_conversation(self, idx):
        """Display a previous conversation in full."""
        if 0 <= idx < len(self.conversation_history):
            question, answer, image_path = self.conversation_history[idx]
            self.refresh_display()
            self.display_conversation(question, answer, image_path)
            return True
        return False

    def get_multiline_input(self):
        """Handle multi-line input collection."""
        lines = []
        self.console.print("[dim]Enter your recipe (press Enter twice to finish):[/]")
        while True:
            try:
                line = self.console.input().strip()
                if not line:
                    break
                lines.append(line)
            except KeyboardInterrupt:
                raise
        return "\n".join(lines)

    def get_history_selection(self):
        """Get user selection for history or new input."""
        chefs = ["A young, enthusiastic Indian chef specializing in Biryani",
                 "A seasoned Italian chef with a passion for pasta-making",
                 "An old Brazilian grandma who loves to cook classic dishes",
                 "An Argentine chef who is an expert in barbecues"]
        try:
            chef = "\n[bold white]:1."+chefs[0]+"[/] "
            chef += "\n[bold white]:2."+chefs[1]+"[/] "
            chef += "\n[bold white]:3."+chefs[2]+"[/] "
            chef += "\n[bold white]:4."+chefs[3]+"[/] "
            promptChef = "\n[bold blue]:Choose the chef do you want to answer[/] "
            self.console.print(chef)
            whatChef = self.console.input(promptChef).strip()
            if not whatChef:
                raise KeyboardInterrupt

            if whatChef.isdigit() and whatChef in ["1", "2", "3", "4"]:
                idxChef = int(whatChef) - 1
            else:
                self.console.print("\n[red]No correct number was pressed.[/]")
                self.console.input("\n[dim]Press Enter to continue...[/]")
                return None
            self.messages[0]['content'] = chefs[idxChef] + self.messages[0]['content']

            prompt = "\n[bold yellow]Enter number or question:[/] "
            user_input = self.console.input(prompt).strip()

            if not user_input:
                raise KeyboardInterrupt

            if user_input.isdigit():
                idx = int(user_input) - 1
                if self.show_previous_conversation(idx):
                    self.console.input("\n[dim]Press Enter to continue...[/]")
                else:
                    self.console.print("\n[red]No conversation found.[/]")
                    self.console.input("\n[dim]Press Enter to continue...[/]")
                return None

            if "\n" in user_input:
                return self.get_multiline_input()

            return user_input

        except KeyboardInterrupt:
            raise

    def process_response(self, stream, user_input):
        """Process the streaming response and handle image generation."""
        collected_messages = []
        full_response = ""
        image_path = None
        image_started = False

        self.console.print("\n[bold blue]Chef's Response:[/]")

        with Live("", refresh_per_second=10) as live:
            for chunk in stream:
                chunk_message = chunk.choices[0].delta.content or ""
                collected_messages.append(chunk_message)
                full_response = "".join(collected_messages)
                live.update(full_response)

                if not image_started and "ingredients" in full_response.lower():
                    image_started = True
                    image_path = self.ai_clients.generate_dish_image(user_input)
                    if image_path:
                        self.temp_files.append(image_path)

        self.refresh_display()
        self.display_conversation(user_input, full_response, image_path)
        return full_response, image_path

    def display_welcome(self):
        """Display welcome message with ASCII art."""
        title_art = text2art("Chef AI", font="small")
        welcome_message = Panel(
            f"[green]{title_art}[/]\n"
            "[bold green]Hi! I'm your personal chef![/]\n"
            "[italic]Ask me anything about cooking![/]",
            title="👨‍🍳 Recipe Assistant",
            border_style="green",
        )
        self.console.print(welcome_message)

    def refresh_display(self):
        """Clear screen and show welcome message and history."""
        self.console.clear()
        self.display_welcome()
        self.display_history()

    def cleanup(self):
        """Clean up temporary files."""
        for file in self.temp_files:
            try:
                os.remove(file)
            except OSError as e:
                self.console.print(f"[red]Error cleaning up: {str(e)}[/]")

    def run(self):
        """Main application loop."""
        try:
            while True:
                try:
                    self.refresh_display()
                    user_input = self.get_history_selection()
                    if user_input is None:
                        continue

                    self.messages.append({"role": "user", "content": user_input})

                    with self.console.status("[bold green]Preparing your recipe...[/]"):
                        try:
                            stream = self.ai_clients.get_chat_response(self.messages)
                            response, image_path = self.process_response(
                                stream, user_input
                            )
                            self.messages.append(
                                {"role": "assistant", "content": response}
                            )
                            self.conversation_history.append(
                                (user_input, response, image_path)
                            )

                        except KeyboardInterrupt:
                            self.console.print("\n[yellow]Generation interrupted.[/]")
                            raise

                    self.console.input(
                        "\n[dim]Press Enter to continue or Ctrl+C to exit...[/]"
                    )

                except KeyboardInterrupt:
                    raise

        except KeyboardInterrupt:
            self.console.print("\n[bold red]Thanks for cooking with me! Goodbye![/]")
        finally:
            self.cleanup()
