"use client"; //React hooks (useState, createContext, useContext) only work in client components in Next.js.

import React from "react";
import { useState } from "react";
import { useChat } from "../context/ChatContext";
import axios from "axios";
import styled from "styled-components";

const ChatContainer = styled.div`
  max-width: 600px;
  margin: auto;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 10px;
  box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.1);
`;

const ChatInput = styled.input`
  width: 100%;
  padding: 10px;
  margin-top: 10px;
  border-radius: 5px;
  border: 1px solid #ddd;
`;

export default function Chat() {
  const { messages, addMessage } = useChat();
  const [input, setInput] = useState("");

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userInput = input; // Store input before clearing
    setInput("");

    addMessage({ role: "user", content: userInput });

    try {
      const { data } = await axios.post("/api/chat", { message: userInput });
      addMessage({ role: "assistant", content: data.reply });
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      addMessage({ role: "assistant", content: "Error fetching response." });
    }
  };

  return (
    <ChatContainer>
      {messages.map((msg, index) => (
        <p
          key={index}
          style={{ textAlign: msg.role === "user" ? "right" : "left" }}
        >
          <b>{msg.role === "user" ? "You" : "AI"}:</b> {msg.content}
        </p>
      ))}
      <ChatInput
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
      />
    </ChatContainer>
  );
}
