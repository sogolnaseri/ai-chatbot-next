"use client";

import React, { useState, useEffect } from "react";
import { useChat } from "../context/ChatContext";
import { useTheme } from "../context/ThemeContext";
import axios from "axios";
import styled from "styled-components";

const PageWrapper = styled.div`
  position: relative;
  max-width: 900px;
  margin: 0 auto;
  padding-top: 20px;
`;

const ToggleThemeButton = styled.button`
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;

  background-color: #6366f1;
  color: white;
  font-size: 14px;
  border: none;
  border-radius: 20px;
  padding: 8px 16px;
  cursor: pointer;
  transition: background 0.3s ease;

  &:hover {
    background-color: #4f46e5;
  }
`;

const ChatContainer = styled.div`
  position: relative;
  max-width: 600px;
  margin: 40px auto;
  padding: 20px;
  background: ${(props) => props.theme.background};
  color: ${(props) => props.theme.text};
  border-radius: 16px;
  box-shadow: 0px 6px 16px rgba(0, 0, 0, 0.1);
  transition: background 0.3s ease, color 0.3s ease;
`;

const MessageBubble = styled.p<{ role: string }>`
  text-align: ${(props) => (props.role === "user" ? "right" : "left")};
  background-color: ${(props) =>
    props.role === "user" ? props.theme.userBubble : props.theme.aiBubble};
  color: ${(props) => props.theme.text};
  display: inline-block;
  padding: 10px 14px;
  border-radius: 16px;
  margin: 8px 0;
  max-width: 85%;
  transition: background 0.3s ease, color 0.3s ease;
`;

const InputWrapper = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 16px;
`;

const ChatInput = styled.input`
  flex: 1;
  padding: 12px;
  border-radius: 8px;
  background: ${(props) => props.theme.inputBackground};
  border: 1px solid ${(props) => props.theme.inputBorder};
  color: ${(props) => props.theme.text};
  font-size: 16px;
  transition: background 0.3s ease, color 0.3s ease;
`;

const ClearButton = styled.button`
  background-color: ${(props) =>
    props.theme.background === "#1e1e1e" ? "#4f90ff" : "#4f90ff"};
  color: white;
  border: none;
  border-radius: 8px;
  padding: 0 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s ease, color 0.3s ease;

  &:hover {
    background-color: ${(props) =>
      props.theme.background === "#1e1e1e" ? "#3277e0" : "#3277e0"};
  }
`;

export default function Chat() {
  const { messages, addMessage } = useChat();
  const { theme, toggleTheme } = useTheme();
  const [input, setInput] = useState("");
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedMessages = localStorage.getItem("chatMessages");
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        parsed.forEach((msg: { role: string; content: string }) => {
          if (msg.role === "user" || msg.role === "assistant") {
            addMessage({ role: msg.role, content: msg.content });
          }
        });
      } catch (err) {
        console.error("Error parsing saved chat messages:", err);
      }
    }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      localStorage.setItem("chatMessages", JSON.stringify(messages));
    }
  }, [messages, loaded]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userInput = input;
    setInput("");
    addMessage({ role: "user", content: userInput });

    try {
      const fullMessages = [
        {
          role: "system",
          content: "You are a helpful assistant. Answer concisely.",
        },
        ...messages,
        { role: "user", content: userInput },
      ];

      const { data } = await axios.post("/api/chat", {
        messages: fullMessages,
      });
      addMessage({ role: "assistant", content: data.reply });
    } catch (error) {
      console.error("Error from API:", error);
      addMessage({ role: "assistant", content: "Error fetching response." });
    }
  };

  const clearChat = () => {
    localStorage.removeItem("chatMessages");
    window.location.reload();
  };

  return (
    <>
      <ToggleThemeButton onClick={toggleTheme}>
        {theme === "light" ? "Dark Mode 🌙" : "Light Mode ☀️"}
      </ToggleThemeButton>
      <PageWrapper>
        <ChatContainer>
          {messages.map((msg, index) => (
            <MessageBubble key={index} role={msg.role}>
              <b>{msg.role === "user" ? "You" : "AI"}:</b> {msg.content}
            </MessageBubble>
          ))}

          <InputWrapper>
            <ChatInput
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Type your message and press Enter..."
            />
            <ClearButton onClick={clearChat}>Clear Chat</ClearButton>
          </InputWrapper>
        </ChatContainer>
      </PageWrapper>
    </>
  );
}
