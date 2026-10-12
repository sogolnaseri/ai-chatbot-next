import React from "react";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TextEncoder, TextDecoder } from "util";
import fetchMock from "jest-fetch-mock";
import TestWrapper from "../components/TestWrapper";
import Page from "../page";

// jsdom does not expose TextEncoder/TextDecoder as window globals in this
// configuration; polyfill from Node's built-in `util` so Chat.tsx's
// `new TextDecoder()` call works during tests.
Object.assign(global, { TextEncoder, TextDecoder });

// Replaces global.fetch with a jest mock for every test in this file.
fetchMock.enableMocks();

// ── Response mock helpers ─────────────────────────────────────────────────────
//
// These helpers return plain objects that match exactly the subset of the
// Response/ReadableStream API that Chat.tsx uses:
//   response.ok, response.body.getReader(), reader.read()
//
// Using plain objects avoids a hard dependency on ReadableStream (not exposed
// as a jsdom global in this environment) while still exercising the real
// sendMessage logic in Chat.tsx.

type MockReader = {
  read: () => Promise<{ done: boolean; value?: Uint8Array }>;
  releaseLock: () => void;
  cancel: () => Promise<void>;
};

/** 200 response whose body delivers each string as a separate chunk. */
function makeStreamResponse(chunks: string[]): Response {
  const buffers = chunks.map((c) => Buffer.from(c));
  let index = 0;
  const reader: MockReader = {
    read: async () => {
      if (index < buffers.length) {
        return { done: false, value: new Uint8Array(buffers[index++]) };
      }
      return { done: true, value: undefined };
    },
    releaseLock: () => {},
    cancel: async () => {},
  };
  return { ok: true, status: 200, body: { getReader: () => reader } } as unknown as Response;
}

/** Non-2xx response to simulate an HTTP-level API error. */
function makeErrorResponse(status = 500): Response {
  return { ok: false, status, body: null } as unknown as Response;
}

/**
 * 200 response that delivers one chunk then throws on the next read,
 * simulating a network interruption mid-stream.
 */
function makeInterruptedStreamResponse(firstChunk: string): Response {
  let called = false;
  const reader: MockReader = {
    read: async () => {
      if (!called) {
        called = true;
        return { done: false, value: new Uint8Array(Buffer.from(firstChunk)) };
      }
      throw new Error("Network interrupted");
    },
    releaseLock: () => {},
    cancel: async () => {},
  };
  return { ok: true, status: 200, body: { getReader: () => reader } } as unknown as Response;
}

// ── Suite ──────────────────────────────────────────────────────────────────────

describe("Chat Component", () => {
  beforeEach(() => {
    // Prevent localStorage hydration from carrying messages across tests.
    localStorage.clear();
    // Reset call history and per-test mock implementations.
    fetchMock.resetMocks();
  });

  // ── Existing coverage (mocks updated from axios → fetch) ─────────────────

  it("renders chat component correctly", async () => {
    render(
      <TestWrapper>
        <Page />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText("AI Chatbot 🤖")).toBeInTheDocument();
    });

    expect(screen.getByRole("textbox")).toBeInTheDocument();
    // Send button is now part of the UI (new in this feature)
    expect(screen.getByText("Send")).toBeInTheDocument();
  });

  it("sends a message and displays the streamed response", async () => {
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(makeStreamResponse(["Hello! How can I assist you?"]))
    );

    render(
      <TestWrapper>
        <Page />
      </TestWrapper>
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Hi" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() => {
      expect(
        screen.getByText((_, el) => el?.textContent === "You: Hi")
      ).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        screen.getByText(
          (_, el) => el?.textContent === "AI: Hello! How can I assist you?"
        )
      ).toBeInTheDocument();
    });
  });

  it("handles a non-2xx API response", async () => {
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(makeErrorResponse(500))
    );

    render(
      <TestWrapper>
        <Page />
      </TestWrapper>
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Hello" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    await waitFor(() =>
      expect(
        screen.getByText((_, el) => el?.textContent === "AI: Error fetching response.")
      ).toBeInTheDocument()
    );
  });

  // ── New coverage ──────────────────────────────────────────────────────────

  it("shows typing indicator before first token and hides it after stream closes", async () => {
    // Hold the fetch promise open so we can observe the pre-token state.
    let resolveStream!: (r: Response) => void;
    fetchMock.mockImplementationOnce(
      () => new Promise<Response>((res) => { resolveStream = res; })
    );

    render(
      <TestWrapper>
        <Page />
      </TestWrapper>
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Hey" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Fetch still pending — no tokens yet — indicator must be visible.
    await waitFor(() => {
      expect(screen.getByLabelText("AI is typing")).toBeInTheDocument();
    });

    // Deliver the stream and wait for React to finish all async updates.
    await act(async () => {
      resolveStream(makeStreamResponse(["Hi there!"]));
    });

    // Indicator must be gone once streaming completes.
    await waitFor(() => {
      expect(screen.queryByLabelText("AI is typing")).not.toBeInTheDocument();
    });
  });

  it("streams tokens progressively and commits the final message to chat history", async () => {
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(makeStreamResponse(["Hello", " world", "!"]))
    );

    render(
      <TestWrapper>
        <Page />
      </TestWrapper>
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Greet me" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // All three chunks assembled — final committed message must appear.
    await waitFor(() => {
      expect(
        screen.getByText((_, el) => el?.textContent === "AI: Hello world!")
      ).toBeInTheDocument();
    });

    // Streaming state fully reset: input re-enabled, indicator absent.
    expect(screen.getByRole("textbox")).not.toBeDisabled();
    expect(screen.queryByLabelText("AI is typing")).not.toBeInTheDocument();
  });

  it("discards partial content and shows error on an interrupted stream", async () => {
    fetchMock.mockImplementationOnce(() =>
      Promise.resolve(makeInterruptedStreamResponse("Part"))
    );

    render(
      <TestWrapper>
        <Page />
      </TestWrapper>
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "Tell me something" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Error message must surface after the stream errors.
    await waitFor(() => {
      expect(
        screen.getByText((_, el) => el?.textContent === "AI: Error fetching response.")
      ).toBeInTheDocument();
    });

    // The partial streamed chunk must NOT be committed as a chat message.
    expect(
      screen.queryByText((_, el) => el?.textContent === "AI: Part")
    ).not.toBeInTheDocument();

    // Streaming state fully reset — input re-enabled.
    expect(screen.getByRole("textbox")).not.toBeDisabled();
  });

  it("blocks duplicate submission while a stream is in progress", async () => {
    // Hold the stream open so we can assert the disabled mid-stream state.
    let resolveStream!: (r: Response) => void;
    fetchMock.mockImplementation(
      () => new Promise<Response>((res) => { resolveStream = res; })
    );

    render(
      <TestWrapper>
        <Page />
      </TestWrapper>
    );

    const input = screen.getByRole("textbox");
    fireEvent.change(input, { target: { value: "First" } });
    fireEvent.keyDown(input, { key: "Enter", code: "Enter" });

    // Streaming guard engaged: both controls must be visually disabled.
    await waitFor(() => {
      expect(screen.getByRole("textbox")).toBeDisabled();
    });
    expect(screen.getByText("Send")).toBeDisabled();

    // Attempt a second submission via the Send button mid-stream.
    fireEvent.click(screen.getByText("Send"));

    // Resolve and drain the in-flight stream.
    await act(async () => {
      resolveStream(makeStreamResponse(["Done"]));
    });

    // fetch must have been called exactly once despite two send attempts.
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // Only one user message must exist in the conversation.
    const userBubbles = screen.getAllByText(
      (_, el) => el?.getAttribute("role") === "user"
    );
    expect(userBubbles).toHaveLength(1);
  });
});
