import { z } from 'zod';
import { JobDescriptionSchema } from './jd.schema';
import { ResumeFactsSchema, TechStackSchema, StoredProfileSchema } from './resume.schema';

export const GenerateOutreachEmailRequestSchema = z.object({
  job: JobDescriptionSchema,
  resumeFacts: ResumeFactsSchema,
  stack: TechStackSchema.optional(),
  profile: StoredProfileSchema.optional(),
  recruiter: z
    .object({
      name: z.string().optional(),
      title: z.string().nullable().optional(),
      company: z.string().nullable().optional(),
    })
    .optional(),
});

export type GenerateOutreachEmailRequest = z.infer<typeof GenerateOutreachEmailRequestSchema>;

export const GenerateOutreachEmailResponseSchema = z.object({
  subject: z.string().min(1, 'Subject line cannot be empty'),
  body: z.string().min(10, 'Email body cannot be empty'),
});

export type GenerateOutreachEmailResponse = z.infer<typeof GenerateOutreachEmailResponseSchema>;
