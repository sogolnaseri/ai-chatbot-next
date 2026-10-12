import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const { messages } = await req.json();

  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json(
      { error: "Invalid messages format" },
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();

  // One controller shared by both the req.signal listener and the
  // ReadableStream cancel callback, so either path aborts the OpenAI stream.
  const abortController = new AbortController();
  req.signal.addEventListener("abort", () => abortController.abort(), {
    once: true,
  });

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const completion = await openai.chat.completions.create(
          { model: "gpt-3.5-turbo", messages, stream: true },
          { signal: abortController.signal }
        );

        for await (const chunk of completion) {
          const token = chunk.choices[0]?.delta?.content;
          if (token) {
            controller.enqueue(encoder.encode(token));
          }
        }
        controller.close();
      } catch (err: unknown) {
        // Client disconnected or consumer closed the stream — not an error.
        if (abortController.signal.aborted) {
          controller.close();
        } else {
          controller.error(err);
        }
      }
    },
    // Called when the fetch consumer closes its reader (e.g. component unmounts).
    cancel() {
      abortController.abort();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
