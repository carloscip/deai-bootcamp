"use client";

import { useChat } from "ai/react";
import { ChatSection as ChatSectionUI } from "@llamaindex/chat-ui";
import "@llamaindex/chat-ui/styles/markdown.css";
import "@llamaindex/chat-ui/styles/pdf.css";
import CustomChatInput from "./ui/chat/chat-input";
import CustomChatMessages from "./ui/chat/chat-messages";

export function ChatSection() {
  const handler = useChat({
    api: "/api/chat",
  });

  return (
    <ChatSectionUI handler={handler} className="w-full h-full">
      <CustomChatMessages />
      <CustomChatInput />
    </ChatSectionUI>
  );
}
