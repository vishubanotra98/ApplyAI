import { Type } from '@google/genai';
import { getGeminiClient, getModelName, extractJsonFromText } from './gemini.service';
import { JD_SYSTEM_INSTRUCTION, buildJdAnalysisPrompt } from '../prompts/jd.prompt';
import { AnalyzeJdRequest, JobDescription, JobDescriptionSchema } from '../schemas/jd.schema';
import { AppError } from '../utils/errors';

export async function analyzeJobDescription(data: AnalyzeJdRequest): Promise<JobDescription> {
  const { pageText, title, url } = data;

  if (!pageText || pageText.trim().length < 20) {
    throw new AppError(400, 'Page text is too short to extract a job description.');
  }

  // Basic noise reduction
  const normalizedText = pageText
    .replace(/(\r\n|\r|\n){3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim();

  const ai = getGeminiClient();
  const model = getModelName();

  try {
    const response = await ai.models.generateContent({
      model,
      contents: buildJdAnalysisPrompt(normalizedText, title, url),
      config: {
        systemInstruction: JD_SYSTEM_INSTRUCTION,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: 'The exact or normalized job title' },
            company: { type: Type.STRING, description: 'The company or organization name, or null if uncertain', nullable: true },
            location: { type: Type.STRING, description: 'Job location or Remote/Hybrid, or null', nullable: true },
            employmentType: { type: Type.STRING, description: 'Full-time, Part-time, Contract, Internship, or null', nullable: true },
            experienceRequired: { type: Type.STRING, description: 'Experience level e.g. 3+ years or Senior, or null', nullable: true },
            skills: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Normalized list of technical and core skills',
            },
            requirements: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Qualifications and requirements demanded by the role',
            },
            responsibilities: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'Primary tasks and responsibilities of the role',
            },
            keywords: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'High-value ATS keywords and industry terminology',
            },
          },
          required: ['title', 'skills', 'requirements', 'responsibilities', 'keywords'],
        },
      },
    });

    const rawJson = response.text;
    if (!rawJson) {
      throw new AppError(500, 'Failed to extract job description from the page.');
    }

    const parsed = JSON.parse(extractJsonFromText(rawJson));
    const validated = JobDescriptionSchema.parse(parsed);
    return validated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    throw new AppError(500, `Job description analysis failed: ${msg}`);
  }
}
