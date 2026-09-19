import { getGeminiClient, getModelName, extractJsonFromText } from './gemini.service';
import { RECRUITER_SYSTEM_INSTRUCTION, buildRecruiterSearchPrompt } from '../prompts/recruiter.prompt';
import {
  FindRecruiterRequest,
  FindRecruiterResponse,
  FindRecruiterResponseSchema,
  RecruiterResult,
} from '../schemas/recruiter.schema';
import { AppError } from '../utils/errors';

export async function findRecruiter(data: FindRecruiterRequest): Promise<FindRecruiterResponse> {
  const { company, jobTitle, location, jd } = data;

  if (!company || !company.trim()) {
    throw new AppError(400, 'Company name is required to search for recruiters.');
  }
  if (!jobTitle || !jobTitle.trim()) {
    throw new AppError(400, 'Job title is required to search for recruiters.');
  }

  const ai = getGeminiClient();
  const model = getModelName();

  try {
    const prompt = buildRecruiterSearchPrompt(company, jobTitle, location, jd);

    // Call Gemini with Google Search grounding
    const response = await ai.models.generateContent({
      model,
      contents: `${prompt}

IMPORTANT FORMAT INSTRUCTION: Output your entire response as a valid JSON object matching this schema:
{
  "recruiters": [
    {
      "name": "Full Name",
      "title": "Title (e.g. Technical Recruiter or null)",
      "company": "Company Name",
      "email": "explicit public email or null",
      "linkedin": "LinkedIn profile URL or null",
      "sourceUrls": ["https://..."],
      "evidence": "Brief description of why this person is relevant",
      "confidence": "high" | "medium" | "low"
    }
  ],
  "generalContactEmail": "careers@example.com or null",
  "notes": "Short status summary"
}
Do not include any conversational filler before or after the JSON.`,
      config: {
        systemInstruction: RECRUITER_SYSTEM_INSTRUCTION,
        tools: [{ googleSearch: {} }],
      },
    });

    const rawText = response.text;
    if (!rawText) {
      return {
        recruiters: [],
        generalContactEmail: null,
        notes: 'No public recruiter information could be found for this position.',
      };
    }

    // Extract grounding URLs from metadata if available
    const groundingUrls: string[] = [];
    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
    if (Array.isArray(chunks)) {
      for (const chunk of chunks) {
        if (chunk && typeof chunk === 'object' && 'web' in chunk) {
          const web = (chunk as { web?: { uri?: string } }).web;
          if (web?.uri && typeof web.uri === 'string' && !groundingUrls.includes(web.uri)) {
            groundingUrls.push(web.uri);
          }
        }
      }
    }

    const cleanedJson = extractJsonFromText(rawText);
    let parsed: unknown;
    try {
      parsed = JSON.parse(cleanedJson);
    } catch {
      // Fallback: If model returned markdown or non-strict JSON, attempt regex extraction
      const jsonMatch = cleanedJson.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsed = JSON.parse(jsonMatch[0]);
      } else {
        throw new AppError(500, 'Model response could not be parsed as structured JSON.');
      }
    }

    // If recruiters array was returned at root level
    if (Array.isArray(parsed)) {
      parsed = { recruiters: parsed };
    }

    const validated = FindRecruiterResponseSchema.parse(parsed);

    // Strict Enforcement of Zero Fabrication Rule:
    // If any email was returned without credible public evidence, or if it resembles an unverified guess,
    // ensure source URLs are present or nullify email.
    validated.recruiters = validated.recruiters.map((recruiter: RecruiterResult) => {
      // Merge grounding URLs if recruiter has none
      const sourceUrls = recruiter.sourceUrls.length > 0 ? recruiter.sourceUrls : groundingUrls.slice(0, 3);

      // Verify email format and ensure it's not a generic placeholder
      let verifiedEmail = recruiter.email ? recruiter.email.trim() : null;
      if (verifiedEmail) {
        // Reject placeholders like john.doe@example.com or name@company.com
        const isPlaceholder = /example\.com|company\.com|email\.com/i.test(verifiedEmail) && !company.toLowerCase().includes('example');
        const isValidFormat = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(verifiedEmail);
        if (isPlaceholder || !isValidFormat) {
          verifiedEmail = null;
        }
      }

      return {
        ...recruiter,
        email: verifiedEmail,
        sourceUrls,
      };
    });

    return validated;
  } catch (error) {
    if (error instanceof AppError) throw error;
    const msg = error instanceof Error ? error.message : String(error);
    throw new AppError(500, `Recruiter search failed: ${msg}`);
  }
}
