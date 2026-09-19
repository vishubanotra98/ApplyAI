import { z } from 'zod';
import { JobDescriptionSchema } from './jd.schema';

export const ResumeFactsSchema = z.object({
  summary: z.string().optional(),
  skills: z.array(z.string()),
  experience: z.array(
    z.object({
      company: z.string(),
      role: z.string(),
      dates: z.string().optional(),
      bullets: z.array(z.string()),
      technologies: z.array(z.string()).optional(),
    })
  ),
  projects: z.array(
    z.object({
      name: z.string(),
      description: z.string(),
      technologies: z.array(z.string()),
      bullets: z.array(z.string()),
      url: z.string().optional(),
    })
  ),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        dates: z.string().optional(),
      })
    )
    .optional(),
});

export type ResumeFacts = z.infer<typeof ResumeFactsSchema>;

export const TailorResumeRequestSchema = z.object({
  job: JobDescriptionSchema,
  resumeFacts: ResumeFactsSchema,
  latexTemplate: z.string().min(10, 'LaTeX template must not be empty'),
});

export type TailorResumeRequest = z.infer<typeof TailorResumeRequestSchema>;

export const ResumeChangeSchema = z.object({
  section: z.string(),
  change: z.string(),
  reason: z.string(),
});

export type ResumeChange = z.infer<typeof ResumeChangeSchema>;

export const TailorResumeResponseSchema = z.object({
  updatedLatex: z.string().min(10, 'Updated LaTeX was empty'),
  changes: z.array(ResumeChangeSchema),
});

export type TailorResumeResponse = z.infer<typeof TailorResumeResponseSchema>;

export const CompilePdfRequestSchema = z.object({
  latex: z.string().min(10, 'LaTeX code is required'),
});

export type CompilePdfRequest = z.infer<typeof CompilePdfRequestSchema>;
