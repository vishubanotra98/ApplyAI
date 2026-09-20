import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required.");
    }

    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }

  return aiClient;
}

export function getModelName(): string {
  const envModel = process.env.GEMINI_MODEL?.trim();

  if (envModel?.startsWith("gemini-")) {
    return envModel;
  }

  return "gemini-3.8-flash";
}

/**
 * Strips Markdown code fences and accidental text before JSON.
 */
export function extractJsonFromText(rawText: string): string {
  let cleaned = rawText.trim();

  const fencedMatch = cleaned.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);

  if (fencedMatch) {
    cleaned = fencedMatch[1].trim();
  }

  const firstObjectIndex = cleaned.indexOf("{");
  const firstArrayIndex = cleaned.indexOf("[");

  const validIndexes = [firstObjectIndex, firstArrayIndex].filter(
    (index) => index !== -1,
  );

  if (validIndexes.length > 0) {
    const startIndex = Math.min(...validIndexes);
    cleaned = cleaned.slice(startIndex);
  }

  return cleaned.trim();
}
