import { Router, Request, Response } from 'express';
import { FindRecruiterRequestSchema } from '../schemas/recruiter.schema';
import { findRecruiter } from '../services/recruiter.service';
import { handleApiError } from '../utils/errors';

export const recruiterRouter = Router();

recruiterRouter.post('/find', async (req: Request, res: Response) => {
  try {
    const validatedInput = FindRecruiterRequestSchema.parse(req.body);
    const result = await findRecruiter(validatedInput);
    return res.status(200).json(result);
  } catch (error) {
    return handleApiError(res, error, 'Failed to search for recruiters.');
  }
});
