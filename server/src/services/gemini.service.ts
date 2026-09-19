import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

let aiClient: GoogleGenAI | null = null;

export function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY environment variable is required.');
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

export function getModelName(): string {
  const envModel = process.env.GEMINI_MODEL;
  if (envModel && (envModel.startsWith('gemini-') || envModel.startsWith('veo-') || envModel.startsWith('lyria-'))) {
    return envModel;
  }
  return 'gemini-3.8-flash';
}

/**
 * Strips markdown code block fences if present and returns clean JSON text.
 */
export function extractJsonFromText(rawText: string): string {
  let cleaned = rawText.trim();
  if (cleaned.startsWith('```')) {
    const firstNewline = cleaned.indexOf('\n');
    if (firstNewline !== -1) {
      cleaned = cleaned.substring(firstNewline + 1);
    }
    if (cleaned.endsWith('```')) {
      cleaned = cleaned.substring(0, cleaned.length - 3);
    }
  }
  return cleaned.trim();
}
