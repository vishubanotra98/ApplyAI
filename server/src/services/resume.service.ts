import { Type } from '@google/genai';
import { execFile } from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import { promisify } from 'util';
import { getGeminiClient, getModelName, extractJsonFromText } from './gemini.service';
import { RESUME_SYSTEM_INSTRUCTION, buildResumeTailorPrompt } from '../prompts/resume.prompt';
import {
  TailorResumeRequest,
  TailorResumeResponse,
  TailorResumeResponseSchema,
} from '../schemas/resume.schema';
import { AppError } from '../utils/errors';

const execFileAsync = promisify(execFile);

export async function tailorResume(data: TailorResumeRequest): Promise<TailorResumeResponse> {
  const { job, resumeFacts, latexTemplate } = data;

  if (!latexTemplate || latexTemplate.trim().length < 10) {
    throw new AppError(400, 'A valid master LaTeX resume template is required.');
  }

  const ai = getGeminiClient();
  const model = getModelName();

  try {
    const response = await ai.models.generateContent({
      model,
      contents: buildResumeTailorPrompt(job, resumeFacts, latexTemplate),
      config: {
        systemInstruction: RESUME_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            updatedLatex: {
              type: Type.STRING,
              description: 'The complete, compilable updated LaTeX resume code without markdown code blocks',
            },
            changes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  section: { type: Type.STRING, description: 'Resume section modified (e.g., Experience, Skills, Projects)' },
                  change: { type: Type.STRING, description: 'Summary of the specific factual change made' },
                  reason: { type: Type.STRING, description: 'Objective reason why this emphasizes alignment with the job description' },
                },
                required: ['section', 'change', 'reason'],
              },
            },
          },
          required: ['updatedLatex', 'changes'],
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

    const validated = TailorResumeResponseSchema.parse(parsed);

    // Sanity check: Ensure LaTeX has structural markers
    const hasDocClass = validated.updatedLatex.includes('\\documentclass') || validated.updatedLatex.includes('\\begin{document}');
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
      throw new AppError(500, 'pdflatex exited without generating a PDF file. Please check for syntax errors in your LaTeX template.');
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
