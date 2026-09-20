import { z } from "zod";

import { JobDescriptionSchema } from "./jd.schema.js";
import {
  ResumeFactsSchema,
  TechStackSchema,
  StoredProfileSchema,
} from "./resume.schema.js";

export const GenerateOutreachEmailRequestSchema = z.object({
  job: JobDescriptionSchema,

  resumeFacts: ResumeFactsSchema,

  stack: TechStackSchema.optional(),

  profile: StoredProfileSchema.optional(),

  recruiter: z
    .object({
      name: z.string().trim().min(1).optional(),
      title: z.string().trim().min(1).nullable().optional(),
      company: z.string().trim().min(1).nullable().optional(),
    })
    .optional(),
});

export type GenerateOutreachEmailRequest = z.infer<
  typeof GenerateOutreachEmailRequestSchema
>;

export const GenerateOutreachEmailResponseSchema = z.object({
  subject: z
    .string()
    .trim()
    .min(1, "Subject line cannot be empty")
    .max(150, "Subject line is too long"),

  body: z
    .string()
    .trim()
    .min(10, "Email body is too short")
    .max(3000, "Email body is too long"),
});

export type GenerateOutreachEmailResponse = z.infer<
  typeof GenerateOutreachEmailResponseSchema
>;
