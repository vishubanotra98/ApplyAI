import { Type } from "@google/genai";

import {
  getGeminiClient,
  getModelName,
  extractJsonFromText,
} from "./gemini.service.js";

import {
  RESUME_SYSTEM_INSTRUCTION,
  buildResumeTailorPrompt,
} from "../prompts/resume.prompt.js";

import {
  GeminiTailorResumeResponseSchema,
  ParseMasterResumeRequest,
  ParseMasterResumeResponse,
  ParseMasterResumeResponseSchema,
  TailorResumeRequest,
  TailorResumeResponse,
  TailorResumeResponseSchema,
} from "../schemas/resume.schema.js";

import { AppError } from "../utils/errors.js";
import { applyEditPlan } from "../utils/latexEditor.js";

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import crypto from "node:crypto";

import { extractTextFromLatex } from "../utils/latexParser.js";
import { existsSync } from "node:fs";

const execFileAsync = promisify(execFile);

const MAX_LATEX_LENGTH = 40_000;

export async function tailorResume(
  data: TailorResumeRequest,
): Promise<TailorResumeResponse> {
  const { job, resumeFacts, latexTemplate, stack } = data;

  if (!latexTemplate || latexTemplate.trim().length < 10) {
    throw new AppError(
      400,
      "A valid master LaTeX resume template is required.",
    );
  }

  if (latexTemplate.length > MAX_LATEX_LENGTH) {
    throw new AppError(
      400,
      "The LaTeX resume template is too large to process.",
    );
  }

  if (!job) {
    throw new AppError(400, "A valid job description is required.");
  }

  if (!resumeFacts) {
    throw new AppError(400, "Resume facts are required for tailoring.");
  }

  try {
    const response = await getGeminiClient().models.generateContent({
      model: getModelName(),
      contents: buildResumeTailorPrompt(job, resumeFacts, latexTemplate, stack),
      config: {
        systemInstruction: RESUME_SYSTEM_INSTRUCTION,
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resumeAnalysis: {
              type: Type.OBJECT,
              properties: {
                matchedSkills: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                matchedTechnologies: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                missingTechnologies: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                relevantExperience: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                relevantProjects: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: [
                "matchedSkills",
                "matchedTechnologies",
                "missingTechnologies",
                "relevantExperience",
                "relevantProjects",
              ],
            },
            editPlan: {
              type: Type.OBJECT,
              properties: {
                rewrites: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      section: { type: Type.STRING },
                      originalText: { type: Type.STRING },
                      replacementText: { type: Type.STRING },
                      reason: { type: Type.STRING },
                    },
                    required: [
                      "section",
                      "originalText",
                      "replacementText",
                      "reason",
                    ],
                  },
                },
                reorders: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      section: { type: Type.STRING },
                      item: { type: Type.STRING },
                      targetPosition: { type: Type.INTEGER },
                      reason: { type: Type.STRING },
                    },
                    required: ["section", "item", "targetPosition", "reason"],
                  },
                },
                emphasis: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      section: { type: Type.STRING },
                      targetText: { type: Type.STRING },
                      reason: { type: Type.STRING },
                    },
                    required: ["section", "targetText", "reason"],
                  },
                },
                prunes: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      section: { type: Type.STRING },
                      targetText: { type: Type.STRING },
                      reason: { type: Type.STRING },
                    },
                    required: ["section", "targetText", "reason"],
                  },
                },
              },
              required: ["rewrites", "reorders", "emphasis", "prunes"],
            },
            changes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  section: { type: Type.STRING },
                  type: {
                    type: Type.STRING,
                    enum: ["rewrite", "reorder", "emphasis", "prune"],
                  },
                  description: { type: Type.STRING },
                },
                required: ["section", "type", "description"],
              },
            },
          },
          required: ["resumeAnalysis", "editPlan", "changes"],
        },
      },
    });

    const rawText = response.text?.trim();

    if (!rawText) {
      throw new AppError(
        502,
        "The AI model returned an empty resume analysis.",
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(extractJsonFromText(rawText));
    } catch (error) {
      console.error("[ApplyAI] Invalid resume tailoring JSON:", error);

      throw new AppError(
        502,
        "The AI returned an invalid resume tailoring response.",
        error instanceof Error ? error.message : String(error),
        { cause: error },
      );
    }

    if (
      typeof parsed !== "object" ||
      parsed === null ||
      Array.isArray(parsed)
    ) {
      throw new AppError(
        502,
        "The AI returned an invalid resume tailoring response.",
      );
    }

    const validationResult = GeminiTailorResumeResponseSchema.safeParse(parsed);

    if (!validationResult.success) {
      console.error(
        "[ApplyAI] Invalid resume tailoring structure:",
        validationResult.error.flatten(),
      );

      throw new AppError(
        502,
        "The AI returned an invalid resume tailoring structure.",
      );
    }
    const validated = validationResult.data;

    const updatedLatex = applyEditPlan(latexTemplate, validated.editPlan);

    if (!updatedLatex || updatedLatex.trim().length < 10) {
      throw new AppError(
        500,
        "The generated resume was empty after applying the edit plan.",
      );
    }

    // Validate that the original LaTeX document structure was preserved.
    if (
      latexTemplate.includes("\\documentclass") &&
      !updatedLatex.includes("\\documentclass")
    ) {
      throw new AppError(
        500,
        "The generated resume lost the original LaTeX document structure.",
      );
    }

    if (
      latexTemplate.includes("\\begin{document}") &&
      !updatedLatex.includes("\\begin{document}")
    ) {
      throw new AppError(
        500,
        "The generated resume lost the document body structure.",
      );
    }

    return {
      job,
      resumeAnalysis: validated.resumeAnalysis,
      editPlan: validated.editPlan,
      changes: validated.changes,
      changesSummary: [],
      updatedLatex,
    };
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);

    console.error("[ApplyAI] Resume tailoring failed:", error);

    throw new AppError(
      502,
      "Resume tailoring failed. Please try again later.",
      message,
      { cause: error },
    );
  }
}

export async function compileLatexToPdf(latex: string): Promise<Buffer> {
  if (!latex || latex.trim().length < 10) {
    throw new AppError(400, "Valid LaTeX content is required.");
  }

  const tempDirectory = path.join(
    os.tmpdir(),
    `applyai-resume-${crypto.randomUUID()}`,
  );

  await mkdir(tempDirectory, { recursive: true });

  const texFilePath = path.join(tempDirectory, "resume.tex");
  const pdfFilePath = path.join(tempDirectory, "resume.pdf");

  try {
    await execFileAsync(
      "pdflatex",
      [
        "-interaction=nonstopmode",
        "-halt-on-error",
        "-file-line-error",
        "-output-directory",
        tempDirectory,
        texFilePath,
      ],
      {
        timeout: 30_000,
        cwd: tempDirectory,
      },
    );

    return await readFile(pdfFilePath);
  } catch (error: any) {
    const logFilePath = path.join(tempDirectory, "resume.log");

    let latexLog = "";

    if (existsSync(logFilePath)) {
      latexLog = await readFile(logFilePath, "utf8");
    }

    console.error("[ApplyAI] LaTeX compilation failed:", {
      message: error?.message,
      stdout: error?.stdout,
      stderr: error?.stderr,
      latexLog,
    });

    throw new AppError(
      500,
      "Failed to compile LaTeX into a PDF.",
      error?.stderr || error?.stdout || latexLog || error?.message,
      {
        cause: error,
      },
    );
  }
}

export async function parseMasterResume(
  data: ParseMasterResumeRequest,
): Promise<ParseMasterResumeResponse> {
  const { latexTemplate } = data;

  if (!latexTemplate || latexTemplate.trim().length < 10) {
    throw new AppError(400, "A valid LaTeX resume is required.");
  }

  if (latexTemplate.length > MAX_LATEX_LENGTH) {
    throw new AppError(400, "The LaTeX resume is too large to process.");
  }

  const extractedText = extractTextFromLatex(latexTemplate);

  if (!extractedText.trim()) {
    throw new AppError(
      400,
      "Could not extract readable text from the LaTeX resume.",
    );
  }

  const techStackSchema = {
    type: Type.OBJECT,
    properties: {
      languages: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      frontend: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      backend: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      databases: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      stateManagement: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      styling: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      devTools: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      cloud: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      queues: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
      other: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
      },
    },
    required: [
      "languages",
      "frontend",
      "backend",
      "databases",
      "stateManagement",
      "styling",
      "devTools",
      "cloud",
      "queues",
      "other",
    ],
  };

  const responseSchema = {
    type: Type.OBJECT,
    properties: {
      profile: {
        type: Type.OBJECT,
        properties: {
          firstName: { type: Type.STRING },
          lastName: { type: Type.STRING },
          email: { type: Type.STRING },
          phone: { type: Type.STRING },
          linkedin: { type: Type.STRING },
          github: { type: Type.STRING },
          portfolio: { type: Type.STRING },
          location: { type: Type.STRING },
        },
        required: ["firstName", "lastName", "email"],
      },

      stack: techStackSchema,

      facts: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },

          skills: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },

          stack: techStackSchema,

          experience: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                company: { type: Type.STRING },
                role: { type: Type.STRING },
                dates: { type: Type.STRING },
                bullets: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                technologies: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
              },
              required: ["company", "role", "bullets"],
            },
          },

          projects: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                technologies: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                bullets: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                },
                url: { type: Type.STRING },
              },
              required: ["name", "description", "technologies", "bullets"],
            },
          },

          education: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                institution: { type: Type.STRING },
                degree: { type: Type.STRING },
                dates: { type: Type.STRING },
              },
              required: ["institution", "degree"],
            },
          },
        },
        required: ["skills", "experience", "projects", "education"],
      },
    },
    required: ["profile", "stack", "facts"],
  };

  try {
    const response = await getGeminiClient().models.generateContent({
      model: getModelName(),

      contents: `
Extract structured information from the following resume.

Rules:
- Return only valid JSON matching the provided schema.
- Do not invent or infer information.
- Extract only information explicitly present in the resume.
- Use an empty string for missing string values.
- Use an empty array for missing array values.
- Always include profile, stack, and facts.
- Always include all fields inside stack.
- Always include skills, experience, projects, and education inside facts.
- Preserve the original wording of resume content where possible.
- Do not add placeholder text such as "N/A" or "Unknown".

Resume text:
${extractedText}
      `,

      config: {
        temperature: 0.1,
        responseMimeType: "application/json",
        responseSchema,
      },
    });

    const rawText = response.text?.trim();

    if (!rawText) {
      throw new AppError(
        502,
        "The AI returned an empty resume parsing response.",
      );
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(extractJsonFromText(rawText));
    } catch (error) {
      console.error("[ApplyAI] Invalid resume parsing JSON:", error);

      throw new AppError(
        502,
        "The AI returned invalid resume parsing JSON.",
        error instanceof Error ? error.message : String(error),
        { cause: error },
      );
    }

    const validationResult = ParseMasterResumeResponseSchema.safeParse(parsed);

    if (!validationResult.success) {
      console.error(
        "[ApplyAI] Recruiter Zod issues:",
        JSON.stringify(validationResult.error.issues, null, 2),
      );

      console.error(
        "[ApplyAI] Actual parsed Gemini response:",
        JSON.stringify(parsed, null, 2),
      );

      throw new AppError(
        502,
        "The recruiter search returned an invalid response structure.",
      );
    }
    return validationResult.data;
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    const message = error instanceof Error ? error.message : String(error);

    console.error("[ApplyAI] Master resume parsing failed:", error);

    throw new AppError(
      502,
      "Master resume parsing failed. Please try again later.",
      message,
      { cause: error },
    );
  }
}
