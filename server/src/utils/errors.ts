import { Response } from 'express';
import { ZodError } from 'zod';

export class AppError extends Error {
  statusCode: number;
  userMessage: string;

  constructor(statusCode: number, userMessage: string, internalDetails?: string) {
    super(internalDetails || userMessage);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.userMessage = userMessage;
  }
}

export function handleApiError(res: Response, error: unknown, defaultMessage = 'An unexpected error occurred.') {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.userMessage,
      code: 'APP_ERROR',
    });
  }

  if (error instanceof ZodError) {
    const messages = error.issues.map((issue) => issue.message).join('; ');
    return res.status(400).json({
      error: `Invalid input data: ${messages}`,
      code: 'VALIDATION_ERROR',
    });
  }

  const errStr = error instanceof Error ? error.message : String(error);

  if (errStr.includes('API_KEY') || errStr.includes('apiKey') || errStr.includes('GEMINI_API_KEY')) {
    return res.status(500).json({
      error: 'Gemini API key is missing or not configured. Please check your server environment.',
      code: 'MISSING_API_KEY',
    });
  }

  if (errStr.includes('429') || errStr.toLowerCase().includes('quota') || errStr.toLowerCase().includes('rate limit')) {
    return res.status(429).json({
      error: 'Gemini API rate limit reached. Please wait a few moments before trying again.',
      code: 'RATE_LIMIT',
    });
  }

  return res.status(500).json({
    error: defaultMessage,
    code: 'INTERNAL_ERROR',
  });
}
