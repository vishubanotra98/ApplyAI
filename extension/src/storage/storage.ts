import { StoredData } from '../types';

export const DEFAULT_LATEX_TEMPLATE = `\\documentclass[letterpaper,11pt]{article}
\\usepackage{latexsym}
\\usepackage[empty]{fullpage}
\\usepackage{titlesec}
\\usepackage{marvosym}
\\usepackage[usenames,dvipsnames]{color}
\\usepackage{verbatim}
\\usepackage{enumitem}
\\usepackage[hidelinks]{hyperref}
\\usepackage{fancyhdr}
\\usepackage[english]{babel}
\\usepackage{tabularx}

\\pagestyle{fancy}
\\fancyhf{}
\\fancyfoot{}
\\renewcommand{\\headrulewidth}{0pt}
\\renewcommand{\\footrulewidth}{0pt}

\\addtolength{\\oddsidemargin}{-0.5in}
\\addtolength{\\evensidemargin}{-0.5in}
\\addtolength{\\textwidth}{1in}
\\addtolength{\\topmargin}{-.5in}
\\addtolength{\\textheight}{1.0in}

\\urlstyle{same}

\\raggedbottom
\\raggedright
\\setlength{\\tabcolsep}{0in}

\\titleformat{\\section}{
  \\vspace{-4pt}\\scshape\\raggedright\\large
}{}{0em}{}[\\color{black}\\titlerule \\vspace{-5pt}]

\\newcommand{\\resumeItem}[1]{
  \\item\\small{
    {#1 \\vspace{-2pt}}
  }
}

\\newcommand{\\resumeSubheading}[4]{
  \\vspace{-2pt}\\item
    \\begin{tabular*}{0.97\\textwidth}[t]{l@{\\extracolsep{\\fill}}r}
      \\textbf{#1} & #2 \\\\
      \\textit{\\small#3} & \\textit{\\small #4} \\\\
    \\end{tabular*}\\vspace{-7pt}
}

\\newcommand{\\resumeSubHeadingListStart}{\\begin{itemize}[leftmargin=0.15in, label={}]}
\\newcommand{\\resumeSubHeadingListEnd}{\\end{itemize}}
\\newcommand{\\resumeItemListStart}{\\begin{itemize}}
\\newcommand{\\resumeItemListEnd}{\\end{itemize}\\vspace{-5pt}}

\\begin{document}

\\begin{center}
    \\textbf{\\Huge \\scshape Rahul Sharma} \\\\ \\vspace{1pt}
    \\small +1 (555) 019-2834 $|$ \\href{mailto:rahul.sharma@example.com}{\\underline{rahul.sharma@example.com}} $|$ 
    \\href{https://linkedin.com/in/rahulsharma}{\\underline{linkedin.com/in/rahulsharma}} $|$
    \\href{https://github.com/rahulsharma}{\\underline{github.com/rahulsharma}}
\\end{center}

\\section{Technical Skills}
\\begin{itemize}[leftmargin=0.15in, label={}]
    \\small{\\item{
     \\textbf{Languages}{: TypeScript, JavaScript, Python, SQL, HTML5, CSS3} \\\\
     \\textbf{Frameworks}{: React, Next.js, Node.js, Express, Tailwind CSS, Redux Toolkit} \\\\
     \\textbf{Developer Tools}{: Git, Docker, Vite, Webpack, Jest, Overleaf, Postman} \\\\
     \\textbf{Libraries}{: ReactFlow, Zod, Motion, D3.js, Lucide}
    }}
\\end{itemize}

\\section{Experience}
\\resumeSubHeadingListStart

  \\resumeSubheading
    {Software Developer}{June 2023 -- Present}
    {Vodex Innovations}{San Francisco, CA}
    \\resumeItemListStart
      \\resumeItem{Designed and developed interactive enterprise dashboards serving over 50,000 monthly active users.}
      \\resumeItem{Engineered ReactFlow workflow canvas with sub-second node rendering and real-time state synchronization.}
      \\resumeItem{Implemented RSA--AES end-to-end client encryption protocols protecting sensitive credential payload transfers.}
      \\resumeItem{Architected modular component libraries with strict TypeScript typing, reducing client-side runtime errors by 34\\%.}
    \\resumeItemListEnd

  \\resumeSubheading
    {Frontend Engineer Intern}{May 2022 -- Aug 2022}
    {CloudCraft Systems}{San Jose, CA}
    \\resumeItemListStart
      \\resumeItem{Optimized Core Web Vitals across critical conversion funnels, improving Largest Contentful Paint (LCP) by 42\\%.}
      \\resumeItem{Migrated legacy REST communication layers to React Query hooks with optimistic cache invalidation.}
    \\resumeItemListEnd

\\resumeSubHeadingListEnd

\\section{Projects}
\\resumeSubHeadingListStart
  \\resumeSubheading
    {Subtend -- Distributed Task Runner}{Jan 2023 -- April 2023}
    {TypeScript, Node.js, React, Tailwind CSS}{}
    \\resumeItemListStart
      \\resumeItem{Built a high-throughput job coordinator that parses and executes concurrent async pipelines with telemetry.}
      \\resumeItem{Created an intuitive reactive UI featuring dark-mode visual execution trees and live streaming logs.}
    \\resumeItemListEnd
\\resumeSubHeadingListEnd

\\section{Education}
\\resumeSubHeadingListStart
  \\resumeSubheading
    {University of California, Berkeley}{Berkeley, CA}
    {Bachelor of Science in Computer Science}{Graduated May 2023}
\\resumeSubHeadingListEnd

\\end{document}`;

export const DEFAULT_STORED_DATA: StoredData = {
  profile: {
    firstName: 'Rahul',
    lastName: 'Sharma',
    email: 'rahul.sharma@example.com',
    phone: '+1 (555) 019-2834',
    linkedin: 'https://linkedin.com/in/rahulsharma',
    github: 'https://github.com/rahulsharma',
    portfolio: 'https://rahulsharma.dev',
    location: 'San Francisco, CA',
  },
  resume: {
    latexTemplate: DEFAULT_LATEX_TEMPLATE,
    facts: {
      summary: 'Frontend and Full-Stack Software Developer with 2+ years of experience building performant, accessible web systems in React, TypeScript, and Node.js.',
      skills: [
        'React',
        'TypeScript',
        'JavaScript',
        'Node.js',
        'Express',
        'Next.js',
        'Tailwind CSS',
        'Redux Toolkit',
        'ReactFlow',
        'Git',
        'Docker',
        'SQL',
        'Vite',
        'Zod',
      ],
      experience: [
        {
          company: 'Vodex Innovations',
          role: 'Software Developer',
          dates: 'June 2023 – Present',
          bullets: [
            'Designed and developed interactive enterprise dashboards serving over 50,000 monthly active users.',
            'Engineered ReactFlow workflow canvas with sub-second node rendering and real-time state synchronization.',
            'Implemented RSA–AES end-to-end client encryption protocols protecting sensitive credential payload transfers.',
            'Architected modular component libraries with strict TypeScript typing, reducing client-side runtime errors by 34%.',
          ],
          technologies: ['React', 'TypeScript', 'ReactFlow', 'Tailwind CSS', 'Redux Toolkit', 'Node.js'],
        },
        {
          company: 'CloudCraft Systems',
          role: 'Frontend Engineer Intern',
          dates: 'May 2022 – Aug 2022',
          bullets: [
            'Optimized Core Web Vitals across critical conversion funnels, improving Largest Contentful Paint (LCP) by 42%.',
            'Migrated legacy REST communication layers to React Query hooks with optimistic cache invalidation.',
          ],
          technologies: ['React', 'TypeScript', 'Tailwind CSS', 'REST APIs'],
        },
      ],
      projects: [
        {
          name: 'Subtend',
          description: 'Distributed async task coordinator and reactive dashboard.',
          technologies: ['TypeScript', 'Node.js', 'React', 'Tailwind CSS'],
          bullets: [
            'Built a high-throughput job coordinator that parses and executes concurrent async pipelines with telemetry.',
            'Created an intuitive reactive UI featuring dark-mode visual execution trees and live streaming logs.',
          ],
          url: 'https://github.com/rahulsharma/subtend',
        },
      ],
      education: [
        {
          institution: 'University of California, Berkeley',
          degree: 'Bachelor of Science in Computer Science',
          dates: '2019 – 2023',
        },
      ],
    },
  },
  settings: {
    backendUrl: typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000',
    geminiModel: 'gemini-3.8-flash',
  },
};

const STORAGE_KEY = 'applyai_stored_data_v1';

/**
 * Storage Abstraction:
 * Uses chrome.storage.local when running inside the unpacked extension,
 * and gracefully falls back to localStorage in web preview mode.
 */
export async function getStoredData(): Promise<StoredData> {
  try {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      return new Promise((resolve) => {
        chrome.storage.local.get([STORAGE_KEY], (result) => {
          if (result && result[STORAGE_KEY]) {
            resolve({
              ...DEFAULT_STORED_DATA,
              ...result[STORAGE_KEY],
              settings: {
                ...DEFAULT_STORED_DATA.settings,
                ...(result[STORAGE_KEY].settings || {}),
              },
            });
          } else {
            resolve(DEFAULT_STORED_DATA);
          }
        });
      });
    }

    // LocalStorage fallback for preview/web testing
    if (typeof localStorage !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return {
          ...DEFAULT_STORED_DATA,
          ...JSON.parse(stored),
          settings: {
            ...DEFAULT_STORED_DATA.settings,
            ...(JSON.parse(stored).settings || {}),
          },
        };
      }
    }
  } catch (err) {
    console.warn('Error reading from storage:', err);
  }

  return DEFAULT_STORED_DATA;
}

export async function saveStoredData(data: Partial<StoredData>): Promise<StoredData> {
  const current = await getStoredData();
  const updated: StoredData = {
    ...current,
    ...data,
    profile: {
      ...current.profile,
      ...(data.profile || {}),
    },
    resume: {
      ...current.resume,
      ...(data.resume || {}),
    },
    settings: {
      ...current.settings,
      ...(data.settings || {}),
    },
  };

  try {
    if (typeof chrome !== 'undefined' && chrome?.storage?.local) {
      await new Promise<void>((resolve, reject) => {
        chrome.storage.local.set({ [STORAGE_KEY]: updated }, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    }
  } catch (err) {
    console.error('Error saving stored data:', err);
    throw err;
  }

  return updated;
}

export async function resetToDefaults(): Promise<StoredData> {
  return saveStoredData(DEFAULT_STORED_DATA);
}
