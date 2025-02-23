import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Home from "./page";
import TestWrapper from "./components/TestWrapper";

describe("Home Page", () => {
  it("renders Home component without crashing", () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    expect(screen.getByText("AI Chatbot 🤖")).toBeInTheDocument();
  });
});

