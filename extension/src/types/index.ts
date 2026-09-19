export interface StoredProfile {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  location?: string;
}

export interface TechStack {
  languages: string[];
  frontend: string[];
  backend: string[];
  databases: string[];
  stateManagement: string[];
  styling: string[];
  devTools: string[];
  cloud: string[];
  queues: string[];
  other: string[];
}

export interface ExperienceFact {
  company: string;
  role: string;
  dates?: string;
  bullets: string[];
  technologies?: string[];
}

export interface ProjectFact {
  name: string;
  description: string;
  technologies: string[];
  bullets: string[];
  url?: string;
}

export interface EducationFact {
  institution: string;
  degree: string;
  dates?: string;
}

export interface ResumeFacts {
  summary?: string;
  skills: string[];
  stack?: TechStack;
  experience: ExperienceFact[];
  projects: ProjectFact[];
  education?: EducationFact[];
}

export interface ResumeProfile {
  profile: StoredProfile;
  stack: TechStack;
  facts: ResumeFacts;
}

export interface MasterResume {
  latexTemplate: string;
  lastParsedAt?: string;
}

export interface ResumeData {
  latexTemplate: string;
  facts: ResumeFacts;
}

export interface AppSettings {
  backendUrl: string;
  geminiModel?: string;
}

export interface StoredData {
  profile: StoredProfile;
  stack: TechStack;
  masterResume: MasterResume;
  resume: ResumeData;
  settings: AppSettings;
}

export interface JobDescription {
  title: string;
  company: string | null;
  location: string | null;
  employmentType: string | null;
  experienceRequired: string | null;
  skills: string[];
  requirements: string[];
  responsibilities: string[];
  keywords: string[];
}

export interface ResumeAnalysis {
  matchedSkills: string[];
  matchedTechnologies: string[];
  missingTechnologies: string[];
  relevantExperience: string[];
  relevantProjects: string[];
}

export interface ResumeChange {
  section: string;
  type: 'rewrite' | 'reorder' | 'emphasis' | 'prune' | string;
  description: string;
  change?: string;
  reason?: string;
}

export interface TailoredResumeResult {
  job: JobDescription;
  resumeAnalysis: ResumeAnalysis;
  updatedLatex: string;
  changes: ResumeChange[];
  changesSummary?: string[];
}

export interface TailoredEmailResult {
  subject: string;
  body: string;
}

export interface GenerateOutreachEmailRequest {
  job: JobDescription;
  resumeFacts: ResumeFacts;
  stack?: TechStack;
  profile?: StoredProfile;
  recruiter?: {
    name?: string;
    title?: string | null;
    company?: string | null;
  };
}

export interface RecruiterResult {
  name: string;
  title: string | null;
  company: string | null;
  email: string | null;
  linkedin: string | null;
  sourceUrls: string[];
  evidence: string;
  confidence: 'high' | 'medium' | 'low';
}

export interface RecruiterSearchResponse {
  recruiters: RecruiterResult[];
  generalContactEmail?: string | null;
  notes?: string;
}

export type ExtensionActiveTab = 'apply' | 'results' | 'resume' | 'recruiter' | 'settings';
