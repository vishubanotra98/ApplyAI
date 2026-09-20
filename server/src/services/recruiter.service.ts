import {
  getGeminiClient,
  getModelName,
  extractJsonFromText,
} from "./gemini.service.js";

import {
  RECRUITER_SYSTEM_INSTRUCTION,
  buildRecruiterSearchPrompt,
} from "../prompts/recruiter.prompt.js";

import {
  FindRecruiterRequest,
  FindRecruiterResponse,
  FindRecruiterResponseSchema,
  RecruiterResult,
} from "../schemas/recruiter.schema.js";

import { AppError } from "../utils/errors.js";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isPlaceholderEmail(email: string): boolean {
  return /(example\.com|company\.com|email\.com)$/i.test(email);
}

function sanitizeRecruiter(recruiter: RecruiterResult): RecruiterResult {
  let email = recruiter.email?.trim() || null;

  const hasValidEmailFormat = email !== null && EMAIL_REGEX.test(email);

  const isPlaceholder = email !== null && isPlaceholderEmail(email);

  const hasEvidence =
    recruiter.sourceUrls.length > 0 && recruiter.evidence.trim().length > 0;

  // An email is retained only when it has valid formatting
  // and supporting evidence supplied by the model.
  if (!hasValidEmailFormat || isPlaceholder || !hasEvidence) {
    email = null;
  }

  return {
    ...recruiter,
    email,
    sourceUrls: recruiter.sourceUrls,
  };
}

export async function findRecruiter(
  data: FindRecruiterRequest,
): Promise<FindRecruiterResponse> {
  const { company, jobTitle, location, jd } = data;

  if (!company?.trim()) {
    throw new AppError(
      400,
      "Company name is required to search for recruiters.",
    );
  }

  if (!jobTitle?.trim()) {
    throw new AppError(400, "Job title is required to search for recruiters.");
  }

  const ai = getGeminiClient();
  const model = getModelName();

  try {
    const prompt = buildRecruiterSearchPrompt(
      company.trim(),
      jobTitle.trim(),
      location,
      jd,
    );

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        systemInstruction: RECRUITER_SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: "application/json",
      },
    });

    const rawText = response.text?.trim();

    if (!rawText) {
      return {
        recruiters: [],
        generalContactEmail: null,
        notes:
          "No public recruiter information could be found for this position.",
      };
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(extractJsonFromText(rawText));
    } catch {
      throw new AppError(
        502,
        "The recruiter search returned an invalid structured response.",
      );
    }

    // Support a root-level recruiters array as a defensive fallback.
    if (Array.isArray(parsed)) {
      parsed = { recruiters: parsed };
    }

    const validationResult = FindRecruiterResponseSchema.safeParse(parsed);

    if (!validationResult.success) {
      console.error(
        "[ApplyAI] Invalid recruiter response:",
        JSON.stringify(validationResult.error.issues, null, 2),
      );

      console.error(
        "[ApplyAI] Raw parsed recruiter response:",
        JSON.stringify(parsed, null, 2),
      );

      throw new AppError(
        502,
        "The recruiter search returned an invalid response structure.",
      );
    }
    const validated = validationResult.data;

    const recruiters = validated.recruiters.map((recruiter: RecruiterResult) =>
      sanitizeRecruiter(recruiter),
    );

    return {
      ...validated,
      recruiters,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);

    console.error("[ApplyAI] Recruiter search failed:", error);

    throw new AppError(
      502,
      "Recruiter search failed. Please try again later.",
      message,
      { cause: error },
    );
  }
}
