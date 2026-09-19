import { Type } from '@google/genai';
import { execFile } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { getGeminiClient, getModelName, extractJsonFromText } from './gemini.service';
import { RESUME_SYSTEM_INSTRUCTION, buildResumeTailorPrompt } from '../prompts/resume.prompt';
import { PARSE_RESUME_SYSTEM_INSTRUCTION, buildParseResumePrompt } from '../prompts/parseResume.prompt';
import { extractTextFromLatex } from '../utils/latexParser';
import {
  TailorResumeRequest,
  TailorResumeResponse,
  TailorResumeResponseSchema,
  ParseMasterResumeRequest,
  ParseMasterResumeResponse,
  ParseMasterResumeResponseSchema,
} from '../schemas/resume.schema';
import { AppError } from '../utils/errors';

const execFileAsync = promisify(execFile);

export async function tailorResume(data: TailorResumeRequest): Promise<TailorResumeResponse> {
  const { job, resumeFacts, latexTemplate, stack } = data;

  if (!latexTemplate || latexTemplate.trim().length < 10) {
    throw new AppError(400, 'A valid master LaTeX resume template is required.');
  }

  const ai = getGeminiClient();
  const model = getModelName();

  try {
    const response = await ai.models.generateContent({
      model,
      contents: buildResumeTailorPrompt(job, resumeFacts, latexTemplate, stack),
      config: {
        systemInstruction: RESUME_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            resumeAnalysis: {
              type: Type.OBJECT,
              properties: {
                matchedSkills: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Skills explicitly present in candidate facts that match the job description',
                },
                matchedTechnologies: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Candidate tech stack items that align with JD requirements',
                },
                missingTechnologies: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Technologies required or mentioned in JD that candidate does NOT have; strictly omitted from resume',
                },
                relevantExperience: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Candidate work experiences most aligned to emphasize',
                },
                relevantProjects: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Candidate projects most aligned to emphasize',
                },
              },
              required: [
                'matchedSkills',
                'matchedTechnologies',
                'missingTechnologies',
                'relevantExperience',
                'relevantProjects',
              ],
            },
            updatedLatex: {
              type: Type.STRING,
              description: 'The tailored compilable LaTeX code preserving all document macros, commands, and layout',
            },
            changesSummary: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Concise summary bullets of changes made based on existing facts (e.g. Emphasized React and TypeScript, Highlighted ReactFlow, Selected Subtend project, Reworded 2 bullets)',
            },
            changes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  section: {
                    type: Type.STRING,
                    description: 'Section or company/project modified (e.g. Vodex, Technical Skills, Projects)',
                  },
                  type: {
                    type: Type.STRING,
                    enum: ['rewrite', 'reorder', 'emphasis', 'prune'],
                    description: 'Classification of the modification',
                  },
                  description: {
                    type: Type.STRING,
                    description: 'Detailed description explaining how existing facts were emphasized for this JD',
                  },
                },
                required: ['section', 'type', 'description'],
              },
            },
          },
          required: ['resumeAnalysis', 'updatedLatex', 'changes'],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new AppError(500, 'Failed to generate tailored resume from model.');
    }

    const parsed = JSON.parse(extractJsonFromText(rawText));

    // Strip accidental code block fences if present inside updatedLatex string
    if (typeof parsed.updatedLatex === 'string') {
      parsed.updatedLatex = parsed.updatedLatex.replace(/^```latex\s*/i, '').replace(/```$/i, '').trim();
    }

    // Format concise change summary bullets
    const rawChanges = parsed.changes || [];
    const derivedSummary: string[] = (parsed.changesSummary && parsed.changesSummary.length > 0)
      ? parsed.changesSummary
      : rawChanges.map((c: any) => c.description || c.change || `${c.type}: ${c.section}`).slice(0, 6);

    // Attach original job description to the returned response object
    const finalPayload = {
      job,
      resumeAnalysis: parsed.resumeAnalysis || {
        matchedSkills: [],
        matchedTechnologies: [],
        missingTechnologies: [],
        relevantExperience: [],
        relevantProjects: [],
      },
      updatedLatex: parsed.updatedLatex,
      changes: rawChanges,
      changesSummary: derivedSummary,
    };

    const validated = TailorResumeResponseSchema.parse(finalPayload);

    // Sanity check: Ensure LaTeX has structural markers
    const hasDocClass =
      validated.updatedLatex.includes('\\documentclass') ||
      validated.updatedLatex.includes('\\begin{document}');
    if (!hasDocClass && latexTemplate.includes('\\documentclass')) {
      throw new AppError(500, 'Generated LaTeX was missing core document structure.');
    }

    return validated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    throw new AppError(500, `Resume tailoring failed: ${msg}`);
  }
}

/**
 * Parses a Master LaTeX resume once into a structured Resume Profile,
 * extracting the categorized tech stack, ground truth experience, and contact profile.
 * Preprocesses the LaTeX to remove formatting macros and comments, ensuring
 * the LLM receives only textual resume content and responds ONLY with structured profile data.
 */
export async function parseMasterResume(
  data: ParseMasterResumeRequest
): Promise<ParseMasterResumeResponse> {
  const { latexTemplate } = data;

  if (!latexTemplate || latexTemplate.trim().length < 10) {
    throw new AppError(400, 'Master LaTeX resume template is required to parse.');
  }

  // 1. Locally extract clean text from the LaTeX template to reduce token overhead and strip LaTeX commands
  const cleanResumeText = extractTextFromLatex(latexTemplate);
  const promptContent = cleanResumeText && cleanResumeText.length > 50 ? cleanResumeText : latexTemplate;

  const ai = getGeminiClient();
  const model = getModelName();

  try {
    const response = await ai.models.generateContent({
      model,
      contents: buildParseResumePrompt(promptContent),
      config: {
        systemInstruction: PARSE_RESUME_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            profile: {
              type: Type.OBJECT,
              properties: {
                firstName: { type: Type.STRING },
                lastName: { type: Type.STRING },
                email: { type: Type.STRING },
                phone: { type: Type.STRING, nullable: true },
                linkedin: { type: Type.STRING, nullable: true },
                github: { type: Type.STRING, nullable: true },
                portfolio: { type: Type.STRING, nullable: true },
                location: { type: Type.STRING, nullable: true },
              },
              required: ['firstName', 'lastName', 'email'],
            },
            stack: {
              type: Type.OBJECT,
              properties: {
                languages: { type: Type.ARRAY, items: { type: Type.STRING } },
                frontend: { type: Type.ARRAY, items: { type: Type.STRING } },
                backend: { type: Type.ARRAY, items: { type: Type.STRING } },
                databases: { type: Type.ARRAY, items: { type: Type.STRING } },
                stateManagement: { type: Type.ARRAY, items: { type: Type.STRING } },
                styling: { type: Type.ARRAY, items: { type: Type.STRING } },
                devTools: { type: Type.ARRAY, items: { type: Type.STRING } },
                cloud: { type: Type.ARRAY, items: { type: Type.STRING } },
                queues: { type: Type.ARRAY, items: { type: Type.STRING } },
                other: { type: Type.ARRAY, items: { type: Type.STRING } },
              },
              required: [
                'languages',
                'frontend',
                'backend',
                'databases',
                'stateManagement',
                'styling',
                'devTools',
                'cloud',
                'queues',
                'other',
              ],
            },
            facts: {
              type: Type.OBJECT,
              properties: {
                summary: { type: Type.STRING, nullable: true },
                skills: { type: Type.ARRAY, items: { type: Type.STRING } },
                experience: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      company: { type: Type.STRING },
                      role: { type: Type.STRING },
                      dates: { type: Type.STRING, nullable: true },
                      bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                      technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                    },
                    required: ['company', 'role', 'bullets'],
                  },
                },
                projects: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      name: { type: Type.STRING },
                      description: { type: Type.STRING },
                      technologies: { type: Type.ARRAY, items: { type: Type.STRING } },
                      bullets: { type: Type.ARRAY, items: { type: Type.STRING } },
                      url: { type: Type.STRING, nullable: true },
                    },
                    required: ['name', 'description', 'technologies', 'bullets'],
                  },
                },
                education: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      institution: { type: Type.STRING },
                      degree: { type: Type.STRING },
                      dates: { type: Type.STRING, nullable: true },
                    },
                    required: ['institution', 'degree'],
                  },
                },
              },
              required: ['skills', 'experience', 'projects'],
            },
          },
          required: ['profile', 'stack', 'facts'],
        },
      },
    });

    const rawText = response.text;
    if (!rawText || rawText.trim().length === 0) {
      throw new AppError(500, 'Received empty response from AI model during resume parsing.');
    }

    const cleanedJson = extractJsonFromText(rawText);
    let parsed: any;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch (jsonErr) {
      const msg = jsonErr instanceof Error ? jsonErr.message : String(jsonErr);
      throw new AppError(500, `Failed to parse structured JSON from model response: ${msg}`);
    }

    // Explicitly guarantee no LaTeX template leaked into the profile response object
    if (parsed.latexTemplate) delete parsed.latexTemplate;
    if (parsed.latex) delete parsed.latex;
    if (parsed.template) delete parsed.template;
    if (parsed.updatedLatex) delete parsed.updatedLatex;

    const validationResult = ParseMasterResumeResponseSchema.safeParse(parsed);
    if (!validationResult.success) {
      const issues = validationResult.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join(', ');
      throw new AppError(500, `Profile response did not match expected schema: ${issues}`);
    }

    return validationResult.data;
  } catch (error) {
    if (error instanceof AppError) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    throw new AppError(500, `Master resume parsing failed: ${msg}`);
  }
}

/**
 * Checks whether pdflatex executable is installed and available in PATH.
 */
async function isPdflatexAvailable(): Promise<boolean> {
  try {
    await execFileAsync('which', ['pdflatex']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely compiles a LaTeX string into a PDF Buffer using local pdflatex.
 */
export async function compileLatexToPdf(latex: string): Promise<Buffer> {
  if (!latex || !latex.trim()) {
    throw new AppError(400, 'LaTeX content is required for compilation.');
  }

  const hasPdflatex = await isPdflatexAvailable();
  if (!hasPdflatex) {
    throw new AppError(
      501,
      'Local PDF compilation is unavailable because pdflatex is not installed on this system. You can download the tailored .tex file directly and compile it with Overleaf or any local TeX editor.'
    );
  }

  const tempDirId = crypto.randomUUID();
  const tempDir = path.join(os.tmpdir(), `applyai-tex-${tempDirId}`);

  try {
    await fs.promises.mkdir(tempDir, { recursive: true });
    const texPath = path.join(tempDir, 'resume.tex');
    const pdfPath = path.join(tempDir, 'resume.pdf');

    await fs.promises.writeFile(texPath, latex, 'utf8');

    // Run pdflatex with strict sandboxing and timeouts
    await execFileAsync(
      'pdflatex',
      [
        '-interaction=nonstopmode',
        '-halt-on-error',
        '-output-directory',
        tempDir,
        texPath,
      ],
      {
        cwd: tempDir,
        timeout: 15000, // 15 second timeout
        maxBuffer: 5 * 1024 * 1024,
      }
    );

    if (!fs.existsSync(pdfPath)) {
      throw new AppError(
        500,
        'pdflatex exited without generating a PDF file. Please check for syntax errors in your LaTeX template.'
      );
    }

    const pdfBuffer = await fs.promises.readFile(pdfPath);
    return pdfBuffer;
  } catch (error) {
    if (error instanceof AppError) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    throw new AppError(500, `LaTeX compilation error: ${msg}`);
  } finally {
    // Clean up temporary files safely
    try {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    } catch (cleanupErr) {
      console.warn('Failed to clean up temporary LaTeX dir:', cleanupErr);
    }
  }
}
