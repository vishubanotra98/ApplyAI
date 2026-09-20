import { Response } from "express";
import { ZodError } from "zod";

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly userMessage: string;

  constructor(
    statusCode: number,
    userMessage: string,
    internalDetails?: string,
    options?: ErrorOptions,
  ) {
    super(internalDetails || userMessage, options);

    this.name = "AppError";
    this.statusCode = statusCode;
    this.userMessage = userMessage;

    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function handleApiError(
  res: Response,
  error: unknown,
  defaultMessage = "An unexpected error occurred.",
) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.userMessage,
      code: "APP_ERROR",
    });
  }

  if (error instanceof ZodError) {
    const messages = error.issues.map((issue) => issue.message).join("; ");

    return res.status(400).json({
      error: `Invalid input data: ${messages}`,
      code: "VALIDATION_ERROR",
    });
  }

  const errorMessage = error instanceof Error ? error.message : String(error);

  const normalizedMessage = errorMessage.toLowerCase();

  if (
    normalizedMessage.includes("api_key") ||
    normalizedMessage.includes("apikey") ||
    normalizedMessage.includes("gemini_api_key")
  ) {
    return res.status(500).json({
      error: "AI service configuration is missing.",
      code: "MISSING_API_KEY",
    });
  }

  if (
    normalizedMessage.includes("429") ||
    normalizedMessage.includes("quota") ||
    normalizedMessage.includes("rate limit") ||
    normalizedMessage.includes("resource exhausted")
  ) {
    return res.status(429).json({
      error: "AI service rate limit reached. Please try again later.",
      code: "RATE_LIMIT",
    });
  }

  console.error("[ApplyAI] Unhandled API error:", error);

  return res.status(500).json({
    error: defaultMessage,
    code: "INTERNAL_ERROR",
  });
}
