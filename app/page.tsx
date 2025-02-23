"use client";

import React from "react";
import Chat from "./components/Chat";
import { ChatProvider } from "./context/ChatContext";

export default function Home() {
  return (
    <ChatProvider>
      <h1 style={{ textAlign: "center" }}>AI Chatbot 🤖</h1>
      <Chat />
    </ChatProvider>
  );
}
