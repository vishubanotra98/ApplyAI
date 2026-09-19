import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  FindRecruiterRequestSchema,
  FindRecruiterResponseSchema,
  RecruiterResultSchema,
} from '../server/src/schemas/recruiter.schema';

describe('Recruiter Result Schema and Grounding Validation', () => {
  it('validates recruiter request schema', () => {
    const validRequest = {
      company: 'Stripe',
      jobTitle: 'Frontend Infrastructure Engineer',
      location: 'San Francisco, CA',
    };

    const parsed = FindRecruiterRequestSchema.parse(validRequest);
    assert.equal(parsed.company, 'Stripe');
    assert.equal(parsed.jobTitle, 'Frontend Infrastructure Engineer');
  });

  it('rejects recruiter request with missing company', () => {
    assert.throws(() => {
      FindRecruiterRequestSchema.parse({
        company: '',
        jobTitle: 'Software Engineer',
      });
    });
  });

  it('validates recruiter found WITH explicit public email', () => {
    const recruiterData = {
      name: 'Sarah Connor',
      title: 'Senior Technical Recruiter',
      company: 'Stripe',
      email: 'sconnor@stripe.com',
      linkedin: 'https://linkedin.com/in/sarah-connor',
      sourceUrls: ['https://stripe.com/jobs/team'],
      evidence: 'Listed on official Stripe recruiting team page.',
      confidence: 'high',
    };

    const parsed = RecruiterResultSchema.parse(recruiterData);
    assert.equal(parsed.name, 'Sarah Connor');
    assert.equal(parsed.email, 'sconnor@stripe.com');
    assert.equal(parsed.confidence, 'high');
  });

  it('validates recruiter found WITHOUT email (strict zero-fabrication)', () => {
    const recruiterData = {
      name: 'Alex Rivera',
      title: 'Talent Acquisition Partner',
      company: 'Linear',
      email: null,
      linkedin: 'https://linkedin.com/in/alex-rivera-talent',
      sourceUrls: ['https://linear.app/careers'],
      evidence: 'Found public LinkedIn profile matching engineering recruiter at Linear.',
      confidence: 'medium',
    };

    const parsed = RecruiterResultSchema.parse(recruiterData);
    assert.equal(parsed.name, 'Alex Rivera');
    assert.equal(parsed.email, null);
    assert.equal(parsed.confidence, 'medium');
  });

  it('validates empty recruiters list with fallback general contact email', () => {
    const responseData = {
      recruiters: [],
      generalContactEmail: 'jobs@smallstartup.io',
      notes: 'No individual recruiters publicly disclosed. Use general hiring channel.',
    };

    const parsed = FindRecruiterResponseSchema.parse(responseData);
    assert.equal(parsed.recruiters.length, 0);
    assert.equal(parsed.generalContactEmail, 'jobs@smallstartup.io');
  });
});
