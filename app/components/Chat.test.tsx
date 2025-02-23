import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import axios from "axios";
import TestWrapper from "../components/TestWrapper";
import Home from "../page";

// Mock axios
jest.mock("axios");

describe("Chat Component", () => {
  it("renders chat component correctly", async () => {
    render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

    await waitFor(() => {
      expect(screen.getByText("AI Chatbot 🤖")).toBeInTheDocument();
    });

    expect(screen.getByRole("textbox")).toBeInTheDocument();
  });

  it("sends a message and updates UI", async () => {
    const mockResponse = { data: { reply: "Hello! How can I assist you?" } };
    (axios.post as jest.Mock).mockResolvedValueOnce(mockResponse);

    render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Hi" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "You: Hi";
        })
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "AI: Hello! How can I assist you?";
        })
      ).toBeInTheDocument();
    });
  });

  it("handles API errors", async () => {
    (axios.post as jest.Mock).mockRejectedValueOnce(new Error("API error"));

    render(
        <TestWrapper>
          <Home />
        </TestWrapper>
      );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() =>
      expect(
        screen.getByText((content, element) => {
          return element?.textContent === "AI: Error fetching response.";
        })
      ).toBeInTheDocument()
    );
  });
});
