import { Type } from "@google/genai";

import {
  getGeminiClient,
  getModelName,
  extractJsonFromText,
} from "./gemini.service.js";

import {
  JD_SYSTEM_INSTRUCTION,
  buildJdAnalysisPrompt,
} from "../prompts/jd.prompt.js";

import {
  AnalyzeJdRequest,
  JobDescription,
  JobDescriptionSchema,
} from "../schemas/jd.schema.js";

import { AppError } from "../utils/errors.js";

const MAX_PAGE_TEXT_LENGTH = 60_000;

export async function analyzeJobDescription(
  data: AnalyzeJdRequest,
): Promise<JobDescription> {
  const { pageText, title, url } = data;

  if (!pageText || pageText.trim().length < 20) {
    throw new AppError(
      400,
      "Page text is too short to extract a job description.",
    );
  }

  // Basic noise reduction.
  const normalizedText = pageText
    .replace(/\u00a0/g, " ")
    .replace(/(\r\n|\r|\n){3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();

  if (normalizedText.length < 20) {
    throw new AppError(400, "Page text is too short after normalization.");
  }

  // Prevent excessively large webpage content from being sent to Gemini.
  const truncatedText = normalizedText.slice(0, MAX_PAGE_TEXT_LENGTH);

  const ai = getGeminiClient();
  const model = getModelName();

  try {
    const response = await ai.models.generateContent({
      model,
      contents: buildJdAnalysisPrompt(truncatedText, title, url),
      config: {
        systemInstruction: JD_SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: "application/json",

        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: "Exact or normalized job title",
            },

            company: {
              type: Type.STRING,
              description: "Company name, or null if unavailable",
              nullable: true,
            },

            location: {
              type: Type.STRING,
              description: "Location, Remote, Hybrid, or null",
              nullable: true,
            },

            employmentType: {
              type: Type.STRING,
              description:
                "Full-time, Part-time, Contract, Internship, or null",
              nullable: true,
            },

            experienceRequired: {
              type: Type.STRING,
              description:
                "Required experience level, such as 3+ years or Senior, or null",
              nullable: true,
            },

            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Normalized technical and core skills",
            },

            requirements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Qualifications and role requirements",
            },

            responsibilities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Primary responsibilities of the role",
            },

            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "High-value ATS keywords and terminology",
            },
          },

          required: [
            "title",
            "skills",
            "requirements",
            "responsibilities",
            "keywords",
          ],
        },
      },
    });

    const rawText = response.text?.trim();

    if (!rawText) {
      throw new AppError(
        502,
        "The AI model returned an empty job description response.",
      );
    }

    let parsed: unknown;

    try {
      const cleanJson = extractJsonFromText(rawText);
      parsed = JSON.parse(cleanJson);
    } catch {
      throw new AppError(
        502,
        "The AI returned an invalid or incomplete job description response.",
      );
    }

    const validationResult = JobDescriptionSchema.safeParse(parsed);

    if (!validationResult.success) {
      console.error(
        "[ApplyAI] Invalid JD analysis response:",
        validationResult.error.flatten(),
      );

      throw new AppError(
        502,
        "The AI returned a job description with an invalid structure.",
      );
    }

    return validationResult.data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);

    console.error("[ApplyAI] Job description analysis failed:", error);

    throw new AppError(502, `Job description analysis failed: ${message}`);
  }
}
