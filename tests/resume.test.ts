import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ResumeFactsSchema,
  TailorResumeRequestSchema,
  TailorResumeResponseSchema,
} from '../server/src/schemas/resume.schema';

describe('Resume Schema and Input Validation', () => {
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

  it('validates structured resume facts schema', () => {
    const parsed = ResumeFactsSchema.parse(sampleFacts);
    assert.equal(parsed.skills.length, 3);
    assert.equal(parsed.experience[0].company, 'Vodex Labs');
    assert.equal(parsed.projects[0].name, 'Task Runner');
  });

  it('validates a complete tailor request payload', () => {
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
      latexTemplate: '\\documentclass{article}\\begin{document}Hello World\\end{document}',
    };

    const parsed = TailorResumeRequestSchema.parse(payload);
    assert.equal(parsed.job.title, 'Full Stack Engineer');
    assert.ok(parsed.latexTemplate.includes('\\documentclass'));
  });

  it('validates structured tailoring response with changes log', () => {
    const responsePayload = {
      updatedLatex: '\\documentclass{article}\\begin{document}Tailored Resume Content\\end{document}',
      changes: [
        {
          section: 'Technical Skills',
          change: 'Reordered TypeScript and React to the beginning of Languages',
          reason: 'Aligns directly with primary requirements in JD',
        },
      ],
    };

    const parsed = TailorResumeResponseSchema.parse(responsePayload);
    assert.equal(parsed.changes.length, 1);
    assert.equal(parsed.changes[0].section, 'Technical Skills');
  });
});
