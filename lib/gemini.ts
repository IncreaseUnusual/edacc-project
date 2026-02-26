import { GoogleGenerativeAI } from "@google/generative-ai";

function getClient() {
  const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_GENERATIVE_AI_API_KEY environment variable is not set");
  }
  return new GoogleGenerativeAI(apiKey);
}

export async function generateJSON<T>(prompt: string): Promise<T> {
  const model = getClient().getGenerativeModel({ model: "gemini-flash-latest" });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: {
      responseMimeType: "application/json",
    },
  });

  const text = result.response.text();
  return JSON.parse(text) as T;
}
