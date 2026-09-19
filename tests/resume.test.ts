import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ResumeFactsSchema,
  TechStackSchema,
  TailorResumeRequestSchema,
  TailorResumeResponseSchema,
  ParseMasterResumeResponseSchema,
} from '../server/src/schemas/resume.schema';

describe('Resume Schema and Source of Truth Validation', () => {
  const sampleFacts = {
    skills: ['React', 'TypeScript', 'Node.js'],
    experience: [
      {
        company: 'Vodex Labs',
        role: 'Software Developer',
        dates: '2023 - Present',
        bullets: ['Built React application for analytics dashboard.'],
        technologies: ['React', 'TypeScript'],
      },
    ],
    projects: [
      {
        name: 'Task Runner',
        description: 'Distributed async scheduler.',
        technologies: ['TypeScript', 'Node.js'],
        bullets: ['Processed 10,000 tasks per minute.'],
      },
    ],
  };

  const sampleStack = {
    languages: ['TypeScript', 'JavaScript'],
    frontend: ['React', 'Next.js'],
    backend: ['Node.js', 'Express'],
    databases: ['PostgreSQL'],
    stateManagement: ['Redux Toolkit'],
    styling: ['Tailwind CSS'],
    devTools: ['Git', 'Docker'],
    cloud: [],
    queues: [],
    other: ['Zod'],
  };

  it('validates structured resume facts and stack schema', () => {
    const parsedFacts = ResumeFactsSchema.parse(sampleFacts);
    assert.equal(parsedFacts.skills.length, 3);
    assert.equal(parsedFacts.experience[0].company, 'Vodex Labs');
    assert.equal(parsedFacts.projects[0].name, 'Task Runner');

    const parsedStack = TechStackSchema.parse(sampleStack);
    assert.equal(parsedStack.languages.length, 2);
    assert.equal(parsedStack.frontend[0], 'React');
  });

  it('validates a complete tailor request payload with ground truth stack', () => {
    const payload = {
      job: {
        title: 'Full Stack Engineer',
        company: 'Acme',
        location: 'Remote',
        employmentType: 'Full-time',
        experienceRequired: '2+ years',
        skills: ['React', 'TypeScript', 'Node.js'],
        requirements: ['2+ years experience'],
        responsibilities: ['Build features'],
        keywords: ['React', 'Node'],
      },
      resumeFacts: sampleFacts,
      stack: sampleStack,
      latexTemplate: '\\documentclass{article}\\begin{document}Hello World\\end{document}',
    };

    const parsed = TailorResumeRequestSchema.parse(payload);
    assert.equal(parsed.job.title, 'Full Stack Engineer');
    assert.ok(parsed.latexTemplate.includes('\\documentclass'));
    assert.equal(parsed.stack?.frontend[0], 'React');
  });

  it('validates structured tailoring response with resumeAnalysis and traceable changes', () => {
    const responsePayload = {
      job: {
        title: 'Full Stack Engineer',
        company: 'Acme',
        location: 'Remote',
        employmentType: 'Full-time',
        experienceRequired: '2+ years',
        skills: ['React', 'TypeScript', 'Node.js'],
        requirements: ['2+ years experience'],
        responsibilities: ['Build features'],
        keywords: ['React', 'Node'],
      },
      resumeAnalysis: {
        matchedSkills: ['React', 'TypeScript'],
        matchedTechnologies: ['React', 'Node.js', 'TypeScript'],
        missingTechnologies: ['AWS'], // Missing in resume, strictly omitted
        relevantExperience: ['Vodex Labs'],
        relevantProjects: ['Task Runner'],
      },
      updatedLatex: '\\documentclass{article}\\begin{document}Tailored Resume Content\\end{document}',
      changes: [
        {
          section: 'Vodex Labs',
          type: 'rewrite',
          description: 'Emphasized React and TypeScript state synchronization aligned with the job description.',
        },
      ],
    };

    const parsed = TailorResumeResponseSchema.parse(responsePayload);
    assert.equal(parsed.changes.length, 1);
    assert.equal(parsed.changes[0].section, 'Vodex Labs');
    assert.equal(parsed.changes[0].type, 'rewrite');
    assert.equal(parsed.resumeAnalysis.missingTechnologies[0], 'AWS');
  });

  it('validates parsed master resume response schema', () => {
    const parsedMaster = {
      profile: {
        firstName: 'Rahul',
        lastName: 'Sharma',
        email: 'rahul@example.com',
      },
      stack: sampleStack,
      facts: sampleFacts,
    };

    const validated = ParseMasterResumeResponseSchema.parse(parsedMaster);
    assert.equal(validated.profile.firstName, 'Rahul');
    assert.equal(validated.stack.backend[0], 'Node.js');
  });
});
