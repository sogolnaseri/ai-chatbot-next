import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ChatProvider, useChat } from "./ChatContext";

const TestComponent = () => {
  const { messages, addMessage } = useChat();
  return (
    <div>
      <button onClick={() => addMessage({ role: "user", content: "Hello AI" })}>
        Add Message
      </button>
      <div data-testid="message-count">{messages.length}</div>
    </div>
  );
};

test("should add a new message", async () => {
  render(
    <ChatProvider>
      <TestComponent />
    </ChatProvider>
  );

  // Click the button
  fireEvent.click(screen.getByText("Add Message"));

  await waitFor(() => {
    expect(screen.getByTestId("message-count").textContent).toBe("1");
  });
});
