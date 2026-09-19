import { Router, Request, Response } from 'express';
import { CompilePdfRequestSchema, TailorResumeRequestSchema } from '../schemas/resume.schema';
import { compileLatexToPdf, tailorResume } from '../services/resume.service';
import { handleApiError } from '../utils/errors';

export const resumeRouter = Router();

resumeRouter.post('/tailor', async (req: Request, res: Response) => {
  try {
    const validatedInput = TailorResumeRequestSchema.parse(req.body);
    const result = await tailorResume(validatedInput);
    return res.status(200).json(result);
  } catch (error) {
    return handleApiError(res, error, 'Failed to tailor resume.');
  }
});

resumeRouter.post('/compile', async (req: Request, res: Response) => {
  try {
    const validatedInput = CompilePdfRequestSchema.parse(req.body);
    const pdfBuffer = await compileLatexToPdf(validatedInput.latex);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="tailored_resume.pdf"');
    res.setHeader('Content-Length', pdfBuffer.length);
    return res.status(200).send(pdfBuffer);
  } catch (error) {
    return handleApiError(res, error, 'Failed to compile resume to PDF.');
  }
});
