import { z } from 'zod';

export const AnalyzeJdRequestSchema = z.object({
  url: z.string().optional(),
  title: z.string().optional(),
  pageText: z.string().min(20, 'Page text is too short to be a valid job posting.'),
});

export type AnalyzeJdRequest = z.infer<typeof AnalyzeJdRequestSchema>;

export const JobDescriptionSchema = z.object({
  title: z.string(),
  company: z.string().nullable(),
  location: z.string().nullable(),
  employmentType: z.string().nullable(),
  experienceRequired: z.string().nullable(),
  skills: z.array(z.string()),
  requirements: z.array(z.string()),
  responsibilities: z.array(z.string()),
  keywords: z.array(z.string()),
});

export type JobDescription = z.infer<typeof JobDescriptionSchema>;
