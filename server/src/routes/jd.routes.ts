import { Router, Request, Response } from 'express';
import { AnalyzeJdRequestSchema } from '../schemas/jd.schema.js';
import { analyzeJobDescription } from '../services/jd.service.js';
import { handleApiError } from '../utils/errors.js';

export const jdRouter = Router();

jdRouter.post('/analyze', async (req: Request, res: Response) => {
  try {
    const validatedInput = AnalyzeJdRequestSchema.parse(req.body);
    const result = await analyzeJobDescription(validatedInput);
    return res.status(200).json(result);
  } catch (error) {
    return handleApiError(res, error, 'Failed to analyze job description.');
  }
});
