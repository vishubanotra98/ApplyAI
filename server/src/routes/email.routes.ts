import { Router, Request, Response } from 'express';
import { GenerateOutreachEmailRequestSchema } from '../schemas/email.schema';
import { generateOutreachEmail } from '../services/email.service';
import { handleApiError } from '../utils/errors';

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
