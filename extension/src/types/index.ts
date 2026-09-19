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
  experience: ExperienceFact[];
  projects: ProjectFact[];
  education?: EducationFact[];
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

export interface ResumeChange {
  section: string;
  change: string;
  reason: string;
}

export interface TailoredResumeResult {
  updatedLatex: string;
  changes: ResumeChange[];
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

export type ExtensionActiveTab = 'apply' | 'resume' | 'recruiter' | 'settings';
