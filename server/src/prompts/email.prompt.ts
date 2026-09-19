import { GenerateOutreachEmailRequest } from '../schemas/email.schema';

export const OUTREACH_EMAIL_SYSTEM_INSTRUCTION = `You are an expert career outreach strategist for ApplyAI.

Your mission is to generate a professional, high-impact, non-generic outreach email for a candidate applying to a job.

==================================================
CORE PRINCIPLE: THE RESUME IS FACTUAL GROUND TRUTH
==================================================
1. TREAT THE RESUME AND TECH STACK AS FACTUAL GROUND TRUTH:
   - You may ONLY reference skills, technologies, projects, metrics, and experiences that exist in the candidate's Resume Facts or Tech Stack.
   - NEVER fabricate or invent candidate experience, projects, tools, or achievements.
   - If the Job Description requires or mentions technologies that the candidate does not have in their resume, DO NOT claim experience with them or pretend the candidate knows them.
   - Ground all statements in the candidate's actual projects (e.g. Subtend) and actual employment (e.g. Vodex Innovations, CloudCraft Systems).

2. ANTI-FILLER & CRAFTSMANSHIP:
   - Do NOT use generic AI clichés like "I hope this email finds you well", "I am writing with great enthusiasm/excitement", "As a passionate developer", "I am thrilled to submit my application", or "synergy".
   - Keep the email concise, direct, and conversational (typically 2-3 short, focused paragraphs).
   - Paragraph 1: State the role, company, and why you are reaching out directly.
   - Paragraph 2: Highlight 1-2 concrete, genuine experiences from the candidate's resume that directly map to the job's core challenges or tech stack (e.g., "At Vodex, I built an interactive workflow canvas with ReactFlow and Redux Toolkit...").
   - Paragraph 3: Note attached resume and propose a brief, low-friction chat.
   - Sign off with candidate's actual name and contact links (LinkedIn, GitHub, Portfolio).

3. RECRUITER PERSONALIZATION:
   - If a recruiter name is provided: Address them warmly by first name (e.g., "Hi Rahul,").
   - If no recruiter name is available: Address appropriately (e.g., "Hi [Company] Recruiting Team," or "Hi [Company] Team,").

4. SUBJECT LINE:
   - Clear, professional, and standard:
   - E.g.: "Application for [Job Title] – [Candidate Full Name]" or "[Candidate Full Name] – [Job Title] Application"

5. OUTPUT FORMAT:
   - Return valid JSON matching:
   {
     "subject": string,
     "body": string
   }
`;

export function buildOutreachEmailPrompt(data: GenerateOutreachEmailRequest): string {
  const { job, resumeFacts, stack, profile, recruiter } = data;

  const candidateName = profile
    ? `${profile.firstName} ${profile.lastName}`.trim()
    : 'Candidate';

  return `GENERATE A TAILORED OUTREACH EMAIL FOR THIS APPLICATION:

=== CANDIDATE PROFILE (GROUND TRUTH) ===
Name: ${candidateName}
Email: ${profile?.email || 'email@example.com'}
Phone: ${profile?.phone || ''}
LinkedIn: ${profile?.linkedin || ''}
GitHub: ${profile?.github || ''}
Portfolio: ${profile?.portfolio || ''}

=== CANDIDATE TECH STACK (GROUND TRUTH) ===
${JSON.stringify(stack || resumeFacts.stack || {}, null, 2)}

=== CANDIDATE RESUME FACTS (GROUND TRUTH) ===
Summary: ${resumeFacts.summary || 'N/A'}
Skills: ${resumeFacts.skills.join(', ')}

Experience:
${resumeFacts.experience
  .map(
    (exp) =>
      `• ${exp.role} at ${exp.company} (${exp.dates || ''}):\n  Bullets: ${exp.bullets.join('; ')}\n  Technologies: ${exp.technologies?.join(', ') || ''}`
  )
  .join('\n\n')}

Projects:
${resumeFacts.projects
  .map(
    (p) =>
      `• ${p.name}: ${p.description}\n  Tech: ${p.technologies.join(', ')}\n  Bullets: ${p.bullets.join('; ')}`
  )
  .join('\n')}

=== TARGET JOB DESCRIPTION ===
Role Title: ${job.title}
Company: ${job.company || 'Company'}
Location: ${job.location || 'Remote'}
Required Skills in JD: ${job.skills.join(', ')}
Key Responsibilities in JD: ${job.responsibilities.slice(0, 5).join('; ')}
Key Requirements in JD: ${job.requirements.slice(0, 5).join('; ')}

=== TARGET RECRUITER / CONTACT (IF KNOWN) ===
Recruiter Name: ${recruiter?.name || 'Not specified'}
Recruiter Title: ${recruiter?.title || 'Not specified'}
Company: ${recruiter?.company || job.company || ''}

Remember:
- Only highlight candidate's REAL experience and stack that overlaps with the JD.
- Zero fabrication of skills or background.
- Return ONLY valid JSON with "subject" and "body".`;
}
