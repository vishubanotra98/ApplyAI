import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { JobDescriptionSchema, AnalyzeJdRequestSchema } from '../server/src/schemas/jd.schema';

describe('Job Description Validation', () => {
  it('validates a correct job description schema', () => {
    const sampleJd = {
      title: 'Senior Frontend Engineer',
      company: 'Acme Corp',
      location: 'San Francisco, CA',
      employmentType: 'Full-time',
      experienceRequired: '3+ years',
      skills: ['React', 'TypeScript', 'Tailwind CSS'],
      requirements: ['3+ years with React', 'Strong TypeScript knowledge'],
      responsibilities: ['Build UI components', 'Optimize web performance'],
      keywords: ['React', 'TypeScript', 'Web Vitals', 'Design Systems'],
    };

    const parsed = JobDescriptionSchema.parse(sampleJd);
    assert.equal(parsed.title, 'Senior Frontend Engineer');
    assert.equal(parsed.skills.length, 3);
    assert.equal(parsed.company, 'Acme Corp');
  });

  it('rejects an empty title in job description', () => {
    assert.throws(() => {
      JobDescriptionSchema.parse({
        title: '',
        company: 'Acme Corp',
        skills: ['TypeScript'],
        requirements: ['Code'],
        responsibilities: ['Ship'],
        keywords: ['Tech'],
      });
    });
  });

  it('validates JD extraction request input', () => {
    const validRequest = {
      pageText: 'We are seeking a talented Senior Frontend Engineer to build web interfaces at Stripe.',
      title: 'Stripe - Jobs',
      url: 'https://stripe.com/jobs/1234',
    };

    const parsed = AnalyzeJdRequestSchema.parse(validRequest);
    assert.equal(parsed.title, 'Stripe - Jobs');
    assert.ok(parsed.pageText.length > 10);
  });

  it('rejects extraction request with empty page text', () => {
    assert.throws(() => {
      AnalyzeJdRequestSchema.parse({
        pageText: '   ',
        url: 'https://stripe.com',
      });
    });
  });
});
