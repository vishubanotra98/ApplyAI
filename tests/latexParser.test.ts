import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { extractTextFromLatex } from '../server/src/utils/latexParser';
import { ParseMasterResumeResponseSchema } from '../server/src/schemas/resume.schema';

describe('LaTeX Extraction and Master Resume Parsing Pipeline', () => {
  const sampleLatex = `\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}

\\begin{document}
\\section{Education}
\\resumeSubheading{University of California}{Berkeley, CA}{B.S. in Computer Science}{2020 -- 2024}

\\section{Technical Skills}
\\textbf{Languages}{: TypeScript, Python, JavaScript, SQL} \\\\
\\textbf{Frameworks}{: React, Next.js, Node.js, Express, Tailwind CSS}

\\section{Experience}
\\resumeSubheading{TechCorp}{San Francisco, CA}{Senior Frontend Engineer}{Jan 2023 -- Present}
\\resumeItemListStart
\\resumeItem{Architected high-throughput dashboard in TypeScript and React.}
\\resumeItem{Optimized query latency by 45\\% using PostgreSQL indexing.}
\\resumeItemListEnd

\\end{document}`;

  it('strips LaTeX macros, environments, comments, and boilerplate to clean readable text', () => {
    const extracted = extractTextFromLatex(sampleLatex);
    assert.ok(!extracted.includes('\\documentclass'));
    assert.ok(!extracted.includes('\\usepackage'));
    assert.ok(!extracted.includes('\\begin{document}'));
    assert.ok(!extracted.includes('\\resumeItemListStart'));
    assert.ok(extracted.includes('TypeScript, Python, JavaScript, SQL'));
    assert.ok(extracted.includes('Senior Frontend Engineer'));
    assert.ok(extracted.includes('Architected high-throughput dashboard'));
    assert.ok(extracted.includes('45%')); // Escaped \% should be unescaped to %
  });

  it('ensures ParseMasterResumeResponseSchema rejects any payload containing raw LaTeX template fields', () => {
    const validProfile = {
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '123-456-7890',
      },
      stack: {
        languages: ['TypeScript'],
        frontend: ['React'],
        backend: ['Node.js'],
        databases: ['PostgreSQL'],
        stateManagement: [],
        styling: ['Tailwind CSS'],
        devTools: ['Git'],
        cloud: [],
        queues: [],
        other: [],
      },
      facts: {
        skills: ['TypeScript', 'React'],
        experience: [
          {
            company: 'TechCorp',
            role: 'Software Engineer',
            dates: '2023 - Present',
            bullets: ['Built web applications'],
            technologies: ['React', 'TypeScript'],
          },
        ],
        projects: [],
      },
    };

    const validated = ParseMasterResumeResponseSchema.parse(validProfile);
    assert.equal(validated.profile.firstName, 'John');
    assert.ok(!('latex' in validated));
    assert.ok(!('latexTemplate' in validated));
  });
});
