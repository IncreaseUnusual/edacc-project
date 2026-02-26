import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`Timed out after ${ms}ms`)), ms),
    ),
  ]);
}

async function tryGemini<T>(prompt: string): Promise<T> {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_GENERATIVE_AI_API_KEY not set");

  const model = new GoogleGenerativeAI(apiKey).getGenerativeModel({
    model: "gemini-flash-latest",
  });

  const result = await withTimeout(
    model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json" },
    }),
    5_000,
  );

  return JSON.parse(result.response.text()) as T;
}

async function tryGroq<T>(prompt: string): Promise<T> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

  const groq = new Groq({ apiKey });

  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are a JSON-only assistant. Return ONLY valid JSON, no markdown or explanation.",
      },
      { role: "user", content: prompt },
    ],
    model: "meta-llama/llama-4-scout-17b-16e-instruct",
    temperature: 0.7,
    response_format: { type: "json_object" },
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("Empty response from Groq");

  return JSON.parse(text) as T;
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  try {
    return await tryGemini<T>(prompt);
  } catch (err) {
    console.warn("Gemini failed, falling back to Groq:", (err as Error).message?.slice(0, 100));
    return await tryGroq<T>(prompt);
  }
}
