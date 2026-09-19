import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  GenerateOutreachEmailRequestSchema,
  GenerateOutreachEmailResponseSchema,
} from '../server/src/schemas/email.schema';

describe('Outreach Email Schema and Generation Validation', () => {
  const sampleJob = {
    title: 'Frontend Infrastructure Engineer',
    company: 'Stripe',
    location: 'San Francisco, CA',
    employmentType: 'Full-time',
    experienceRequired: '3+ years',
    skills: ['React', 'TypeScript', 'Vite'],
    requirements: ['3+ years experience with React'],
    responsibilities: ['Build UI infrastructure'],
    keywords: ['React', 'TypeScript', 'Web Vitals'],
  };

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

  const sampleProfile = {
    firstName: 'Vishu',
    lastName: 'Banotra',
    email: 'banotravishu89@gmail.com',
    phone: '+91 98765 43210',
    linkedin: 'https://linkedin.com/in/vishubanotra',
    github: 'https://github.com/vishubanotra',
  };

  it('validates a complete outreach email request with recruiter', () => {
    const payload = {
      job: sampleJob,
      resumeFacts: sampleFacts,
      profile: sampleProfile,
      recruiter: {
        name: 'Sarah Connor',
        title: 'Technical Recruiter',
        company: 'Stripe',
      },
    };

    const parsed = GenerateOutreachEmailRequestSchema.parse(payload);
    assert.equal(parsed.job.title, 'Frontend Infrastructure Engineer');
    assert.equal(parsed.profile?.firstName, 'Vishu');
    assert.equal(parsed.profile?.email, 'banotravishu89@gmail.com');
    assert.equal(parsed.recruiter?.name, 'Sarah Connor');
    assert.equal(parsed.recruiter?.company, 'Stripe');
  });

  it('validates an outreach email request without specific recruiter name', () => {
    const payload = {
      job: sampleJob,
      resumeFacts: sampleFacts,
      profile: sampleProfile,
      recruiter: {
        company: 'Stripe',
      },
    };

    const parsed = GenerateOutreachEmailRequestSchema.parse(payload);
    assert.equal(parsed.recruiter?.company, 'Stripe');
    assert.equal(parsed.recruiter?.name, undefined);
  });

  it('validates a structured outreach email response (subject and body)', () => {
    const responsePayload = {
      subject: 'Frontend Infrastructure Engineer Application — Vishu Banotra',
      body: 'Hi Sarah,\n\nI noticed Stripe is looking for a Frontend Infrastructure Engineer with React and TypeScript expertise.\n\nAt Vodex Labs, I built React applications and specialized in TypeScript workflows. Given Stripe\'s high standard for developer velocity, I would welcome the opportunity to connect regarding how my background aligns with your Core UI team goals.\n\nBest regards,\nVishu Banotra\nbanotravishu89@gmail.com',
    };

    const parsed = GenerateOutreachEmailResponseSchema.parse(responsePayload);
    assert.ok(parsed.subject.includes('Frontend Infrastructure Engineer'));
    assert.ok(parsed.body.includes('Vishu Banotra'));
    assert.ok(parsed.body.includes('Vodex Labs'));
  });

  it('rejects an outreach email response with empty subject or body', () => {
    assert.throws(() => {
      GenerateOutreachEmailResponseSchema.parse({
        subject: '',
        body: '',
      });
    });
  });

  it('rejects an outreach email request without job title', () => {
    assert.throws(() => {
      GenerateOutreachEmailRequestSchema.parse({
        job: {
          title: '',
          company: 'Stripe',
          skills: [],
          requirements: [],
          responsibilities: [],
          keywords: [],
        },
        resumeFacts: sampleFacts,
      });
    });
  });
});
