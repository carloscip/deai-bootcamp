"use client"; // Required for App Router

import { useState } from "react";

export default function Home() {
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const newMessage = { text: input, sender: "user" };
        setMessages([...messages, newMessage]);
        setInput("");
        setLoading(true);

        try {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${process.env.NEXT_PUBLIC_OPENAI_API_KEY}`,
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "system", content: "You are a helpful assistant." }, { role: "user", content: input }],
                }),
            });

            const data = await response.json();
            setMessages((prev) => [...prev, { text: data.choices[0].message.content, sender: "bot" }]);
        } catch (error) {
            setMessages((prev) => [...prev, { text: "Error: Failed to get a response.", sender: "bot" }]);
        }

        setLoading(false);
    };

    return (
        <div className="flex flex-col h-screen bg-gray-900 text-white">
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4">
                {messages.map((msg, index) => (
                    <div
                        key={index}
                        className={`p-2 my-2 rounded-md w-fit max-w-[75%] ${msg.sender === "user"
                            ? "bg-blue-600 ml-auto"
                            : "bg-gray-700 mr-auto"
                            }`}
                    >
                        {msg.text}
                    </div>
                ))}
                {loading && <p className="text-gray-400">Thinking...</p>}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-gray-700 bg-gray-800">
                <div className="flex">
                    <input
                        type="text"
                        className="flex-1 p-2 bg-gray-700 text-white rounded-md focus:outline-none"
                        placeholder="Type a message..."
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                    />
                    <button
                        className="ml-2 bg-blue-500 px-4 py-2 rounded-md"
                        onClick={sendMessage}
                        disabled={loading}
                    >
                        Send
                    </button>
                </div>
            </div>
        </div>
    );
}
