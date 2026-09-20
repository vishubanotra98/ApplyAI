import { z } from "zod";
import { JobDescriptionSchema } from "./jd.schema.js";

export const TechStackSchema = z.object({
  languages: z.array(z.string()).default([]),
  frontend: z.array(z.string()).default([]),
  backend: z.array(z.string()).default([]),
  databases: z.array(z.string()).default([]),
  stateManagement: z.array(z.string()).default([]),
  styling: z.array(z.string()).default([]),
  devTools: z.array(z.string()).default([]),
  cloud: z.array(z.string()).default([]),
  queues: z.array(z.string()).default([]),
  other: z.array(z.string()).default([]),
});

export type TechStack = z.infer<typeof TechStackSchema>;

export const StoredProfileSchema = z.object({
  firstName: z.string().default(""),
  lastName: z.string().default(""),
  email: z.string().default(""),
  phone: z.string().optional(),
  linkedin: z.string().optional(),
  github: z.string().optional(),
  portfolio: z.string().optional(),
  location: z.string().optional(),
});

export type StoredProfile = z.infer<typeof StoredProfileSchema>;

export const ResumeFactsSchema = z.object({
  summary: z.string().optional(),
  skills: z.array(z.string()).default([]),
  stack: TechStackSchema.optional(),
  experience: z
    .array(
      z.object({
        company: z.string(),
        role: z.string(),
        dates: z.string().optional(),
        bullets: z.array(z.string()),
        technologies: z.array(z.string()).optional(),
      }),
    )
    .default([]),
  projects: z
    .array(
      z.object({
        name: z.string(),
        description: z.string(),
        technologies: z.array(z.string()),
        bullets: z.array(z.string()),
        url: z.string().optional(),
      }),
    )
    .default([]),
  education: z
    .array(
      z.object({
        institution: z.string(),
        degree: z.string(),
        dates: z.string().optional(),
      }),
    )
    .optional()
    .default([]),
});

export type ResumeFacts = z.infer<typeof ResumeFactsSchema>;

export const ResumeProfileSchema = z.object({
  profile: StoredProfileSchema,
  stack: TechStackSchema,
  facts: ResumeFactsSchema,
});

export type ResumeProfile = z.infer<typeof ResumeProfileSchema>;

export const ResumeAnalysisSchema = z.object({
  matchedSkills: z.array(z.string()).default([]),
  matchedTechnologies: z.array(z.string()).default([]),
  missingTechnologies: z.array(z.string()).default([]),
  relevantExperience: z.array(z.string()).default([]),
  relevantProjects: z.array(z.string()).default([]),
});

export type ResumeAnalysis = z.infer<typeof ResumeAnalysisSchema>;

export const ResumeChangeSchema = z.object({
  section: z.string(),
  type: z.string().default("rewrite"), // 'rewrite' | 'reorder' | 'emphasis' | 'prune'
  description: z.string(),
  change: z.string().optional(), // For backward compatibility
  reason: z.string().optional(), // For backward compatibility
});

export type ResumeChange = z.infer<typeof ResumeChangeSchema>;

export const TailorResumeRequestSchema = z.object({
  job: JobDescriptionSchema,
  resumeFacts: ResumeFactsSchema,
  latexTemplate: z.string().min(10, "LaTeX template must not be empty"),
  stack: TechStackSchema.optional(),
});

export type TailorResumeRequest = z.infer<typeof TailorResumeRequestSchema>;

export const ParseMasterResumeRequestSchema = z.object({
  latexTemplate: z.string().min(10, "Master LaTeX template is required"),
});

export type ParseMasterResumeRequest = z.infer<
  typeof ParseMasterResumeRequestSchema
>;

export const ParseMasterResumeResponseSchema = z.object({
  profile: StoredProfileSchema,
  stack: TechStackSchema,
  facts: ResumeFactsSchema,
});

export type ParseMasterResumeResponse = z.infer<
  typeof ParseMasterResumeResponseSchema
>;

export const CompilePdfRequestSchema = z.object({
  latex: z.string().min(10, "LaTeX code is required"),
});

export type CompilePdfRequest = z.infer<typeof CompilePdfRequestSchema>;

// Keep your existing schemas:
// JobDescriptionSchema
// ResumeAnalysisSchema
// ResumeChangeSchema

const ResumeRewriteSchema = z.object({
  section: z.string(),
  originalText: z.string(),
  replacementText: z.string(),
  reason: z.string(),
});

const ResumeReorderSchema = z.object({
  section: z.string(),
  item: z.string(),
  targetPosition: z.number().int().nonnegative(),
  reason: z.string(),
});

const ResumeEmphasisSchema = z.object({
  section: z.string(),
  targetText: z.string(),
  reason: z.string(),
});

const ResumePruneSchema = z.object({
  section: z.string(),
  targetText: z.string(),
  reason: z.string(),
});

export const EditPlanSchema = z.object({
  rewrites: z.array(ResumeRewriteSchema).default([]),

  reorders: z.array(ResumeReorderSchema).default([]),

  emphasis: z.array(ResumeEmphasisSchema).default([]),

  prunes: z.array(ResumePruneSchema).default([]),
});

export const TailorResumeResponseSchema = z.object({
  job: JobDescriptionSchema,

  resumeAnalysis: ResumeAnalysisSchema,

  editPlan: EditPlanSchema,

  changes: z.array(ResumeChangeSchema).default([]),

  changesSummary: z.array(z.string()).default([]),

  // This is generated by the backend after applying editPlan.
  updatedLatex: z.string().min(10, "Updated LaTeX was empty"),
});

export type TailorResumeResponse = z.infer<typeof TailorResumeResponseSchema>;

export const GeminiTailorResumeResponseSchema = z.object({
  resumeAnalysis: ResumeAnalysisSchema,
  editPlan: EditPlanSchema,
  changes: z.array(ResumeChangeSchema).default([]),
});
