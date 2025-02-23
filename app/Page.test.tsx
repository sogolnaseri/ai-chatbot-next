import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import Page from "./page";
import TestWrapper from "./components/TestWrapper";

describe("Home Page", () => {
  it("renders Home component without crashing", () => {
    render(
      <TestWrapper>
        <Page />
      </TestWrapper>
    );

    expect(screen.getByText("AI Chatbot 🤖")).toBeInTheDocument();
  });
});

