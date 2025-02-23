import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: NextRequest) {
  const { message } = await req.json();
  const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;

  if (!TOGETHER_API_KEY) {
    return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
  }

  try {
    const response = await axios.post(
      "https://api.together.xyz/v1/completions",
      {
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        prompt: `You are a helpful assistant. Answer concisely.\nUser: ${message}\nAssistant:`,
        max_tokens: 150,
        temperature: 0.3 // Lower randomness for more structured answers
      },
      {
        headers: {
          Authorization: `Bearer ${TOGETHER_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    let rawReply = response.data.choices[0]?.text || "No response";

    // Cleaning: Removing repeated words, ###, extra spaces
    const cleanedReply = rawReply
      .replace(/\n+/g, " ") // Replace multiple newlines with space
      .replace(/###/g, "") // Remove ###
      .replace(/\?\s*/g, "") // Remove leading question marks
      .replace(/\b(\w+)\s+\1\b/gi, "$1") // Remove duplicated words (e.g., "Paris Paris")
      .replace(new RegExp(message, "gi"), "") // Remove user input from the response
      .trim();    

    return NextResponse.json({ reply: cleanedReply });
  } catch (error) {
    console.error("Error fetching response from Together AI:", error);
    return NextResponse.json(
      { error: "Failed to fetch response from Together AI" },
      { status: 500 }
    );
  }
}
