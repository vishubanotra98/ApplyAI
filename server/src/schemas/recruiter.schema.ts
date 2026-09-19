import { z } from 'zod';

export const FindRecruiterRequestSchema = z.object({
  company: z.string().min(1, 'Company name is required'),
  jobTitle: z.string().min(1, 'Job title is required'),
  location: z.string().nullable().optional(),
  jd: z.string().optional(),
});

export type FindRecruiterRequest = z.infer<typeof FindRecruiterRequestSchema>;

export const RecruiterResultSchema = z.object({
  name: z.string(),
  title: z.string().nullable(),
  company: z.string().nullable(),
  email: z.string().nullable(),
  linkedin: z.string().nullable(),
  sourceUrls: z.array(z.string()),
  evidence: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
});

export type RecruiterResult = z.infer<typeof RecruiterResultSchema>;

export const FindRecruiterResponseSchema = z.object({
  recruiters: z.array(RecruiterResultSchema),
  generalContactEmail: z.string().nullable().optional(),
  notes: z.string().optional(),
});

export type FindRecruiterResponse = z.infer<typeof FindRecruiterResponseSchema>;
