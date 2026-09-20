import { Type } from "@google/genai";

import {
  getGeminiClient,
  getModelName,
  extractJsonFromText,
} from "./gemini.service.js";

import {
  OUTREACH_EMAIL_SYSTEM_INSTRUCTION,
  buildOutreachEmailPrompt,
} from "../prompts/email.prompt.js";

import {
  GenerateOutreachEmailRequest,
  GenerateOutreachEmailResponse,
  GenerateOutreachEmailResponseSchema,
} from "../schemas/email.schema.js";

import { AppError } from "../utils/errors.js";

export async function generateOutreachEmail(
  data: GenerateOutreachEmailRequest,
): Promise<GenerateOutreachEmailResponse> {
  const { job, resumeFacts } = data;

  if (!job?.title?.trim()) {
    throw new AppError(
      400,
      "A valid job description with a title is required.",
    );
  }

  if (!resumeFacts?.skills) {
    throw new AppError(
      400,
      "Candidate resume facts are required as the ground truth.",
    );
  }

  const ai = getGeminiClient();
  const model = getModelName();

  try {
    const prompt = buildOutreachEmailPrompt(data);

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: OUTREACH_EMAIL_SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: {
              type: Type.STRING,
              description: "A concise, professional email subject line.",
            },
            body: {
              type: Type.STRING,
              description:
                "A concise outreach email grounded only in candidate facts.",
            },
          },
          required: ["subject", "body"],
        },
      },
    });

    const rawText = response.text?.trim();

    if (!rawText) {
      throw new AppError(502, "The AI model returned an empty response.");
    }

    let parsed: unknown;

    try {
      const cleanJson = extractJsonFromText(rawText);
      parsed = JSON.parse(cleanJson);
    } catch {
      throw new AppError(
        502,
        "The AI model returned an invalid JSON response.",
      );
    }

    const result = GenerateOutreachEmailResponseSchema.safeParse(parsed);

    if (!result.success) {
      console.error(
        "[ApplyAI] Outreach email schema validation failed:",
        result.error.flatten(),
      );

      throw new AppError(
        502,
        "The AI response did not match the expected email format.",
      );
    }

    return result.data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);
    console.error("[ApplyAI] Outreach email generation failed:", error);
    throw new AppError(500, `Failed to generate outreach email: ${message}`);
  }
}
