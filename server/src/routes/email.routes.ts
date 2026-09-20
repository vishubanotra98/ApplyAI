import { Router, Request, Response } from 'express';
import { GenerateOutreachEmailRequestSchema } from '../schemas/email.schema.js';
import { generateOutreachEmail } from '../services/email.service.js';
import { handleApiError } from '../utils/errors.js';

export const emailRouter = Router();

emailRouter.post('/generate', async (req: Request, res: Response) => {
  try {
    const validatedInput = GenerateOutreachEmailRequestSchema.parse(req.body);
    const result = await generateOutreachEmail(validatedInput);
    return res.status(200).json(result);
  } catch (error) {
    return handleApiError(res, error, 'Failed to generate tailored outreach email.');
  }
});
