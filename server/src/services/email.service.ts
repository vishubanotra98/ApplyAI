import { Type } from '@google/genai';
import { getGeminiClient, getModelName, extractJsonFromText } from './gemini.service';
import { OUTREACH_EMAIL_SYSTEM_INSTRUCTION, buildOutreachEmailPrompt } from '../prompts/email.prompt';
import {
  GenerateOutreachEmailRequest,
  GenerateOutreachEmailResponse,
  GenerateOutreachEmailResponseSchema,
} from '../schemas/email.schema';
import { AppError } from '../utils/errors';

export async function generateOutreachEmail(
  data: GenerateOutreachEmailRequest
): Promise<GenerateOutreachEmailResponse> {
  const { job, resumeFacts } = data;

  if (!job || !job.title) {
    throw new AppError(400, 'A valid job description is required to generate an outreach email.');
  }

  if (!resumeFacts || !resumeFacts.skills) {
    throw new AppError(400, 'Candidate resume facts are required as the ground truth.');
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
        temperature: 0.2, // Low temperature for high factual adherence
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: {
              type: Type.STRING,
              description: 'Clear, concise professional email subject line',
            },
            body: {
              type: Type.STRING,
              description: 'Body of the outreach email adhering strictly to candidate facts',
            },
          },
          required: ['subject', 'body'],
        },
      },
    });

    const rawText = response.text;
    if (!rawText) {
      throw new AppError(500, 'Empty response received from AI model.');
    }

    const cleanJson = extractJsonFromText(rawText);
    const parsed = JSON.parse(cleanJson);
    const validated = GenerateOutreachEmailResponseSchema.parse(parsed);

    return validated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    throw new AppError(500, `Failed to generate tailored outreach email: ${msg}`);
  }
}
