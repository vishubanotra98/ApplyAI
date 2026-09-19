import { getStoredData } from '../storage/storage';
import { sanitizeBackendUrl, DEFAULT_BACKEND_URL } from '../config';
import {
  JobDescription,
  RecruiterSearchResponse,
  ResumeFacts,
  StoredProfile,
  TailoredEmailResult,
  GenerateOutreachEmailRequest,
  TailoredResumeResult,
  TechStack,
} from '../types';

export class ApiError extends Error {
  statusCode?: number;
  code?: string;

  constructor(message: string, statusCode?: number, code?: string) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

export async function getBaseUrl(): Promise<string> {
  const data = await getStoredData();
  return sanitizeBackendUrl(data.settings?.backendUrl);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}${endpoint}`;

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    });
  } catch (netErr) {
    throw new ApiError(
      `Cannot connect to ApplyAI backend at ${baseUrl}. Ensure the server is running.`,
      0,
      'NETWORK_ERROR'
    );
  }

  if (!response.ok) {
    let errorMessage = `Server error (${response.status})`;
    let errorCode = 'SERVER_ERROR';

    try {
      const errorJson = await response.json();
      if (errorJson && typeof errorJson === 'object') {
        if ('error' in errorJson && typeof errorJson.error === 'string') {
          errorMessage = errorJson.error;
        }
        if ('code' in errorJson && typeof errorJson.code === 'string') {
          errorCode = errorJson.code;
        }
      }
    } catch {
      // Non-JSON response
    }

    throw new ApiError(errorMessage, response.status, errorCode);
  }

  return response.json() as Promise<T>;
}

export async function checkBackendHealth(): Promise<{ status: string; service: string; model: string; hasApiKey: boolean }> {
  return request('/api/health', { method: 'GET' });
}

export async function analyzeJdApi(params: {
  pageText: string;
  title?: string;
  url?: string;
}): Promise<JobDescription> {
  return request<JobDescription>('/api/jd/analyze', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function parseMasterResumeApi(latexTemplate: string): Promise<{
  profile: StoredProfile;
  stack: TechStack;
  facts: ResumeFacts;
}> {
  return request<{
    profile: StoredProfile;
    stack: TechStack;
    facts: ResumeFacts;
  }>('/api/resume/parse', {
    method: 'POST',
    body: JSON.stringify({ latexTemplate }),
  });
}

export async function tailorResumeApi(params: {
  job: JobDescription;
  resumeFacts: ResumeFacts;
  latexTemplate: string;
  stack?: TechStack;
}): Promise<TailoredResumeResult> {
  return request<TailoredResumeResult>('/api/resume/tailor', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function findRecruiterApi(params: {
  company: string;
  jobTitle: string;
  location?: string | null;
  jd?: string;
}): Promise<RecruiterSearchResponse> {
  return request<RecruiterSearchResponse>('/api/recruiter/find', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

export async function compilePdfApi(latex: string): Promise<Blob> {
  const baseUrl = await getBaseUrl();
  const url = `${baseUrl}/api/resume/compile`;

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latex }),
    });
  } catch {
    throw new ApiError(`Cannot connect to ApplyAI backend at ${baseUrl}`, 0, 'NETWORK_ERROR');
  }

  if (!response.ok) {
    let errorMsg = 'PDF compilation failed';
    try {
      const errJson = await response.json();
      if (errJson?.error) errorMsg = errJson.error;
    } catch {
      // Ignored
    }
    throw new ApiError(errorMsg, response.status);
  }

  return response.blob();
}

export async function generateOutreachEmailApi(
  params: GenerateOutreachEmailRequest
): Promise<TailoredEmailResult> {
  return request<TailoredEmailResult>('/api/email/generate', {
    method: 'POST',
    body: JSON.stringify(params),
  });
}

