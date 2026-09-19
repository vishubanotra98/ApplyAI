# ApplyAI — Personal Job Application Chrome Extension

**ApplyAI** is a developer-focused, local-first Chrome extension and AI backend designed to accelerate job applications without bloat. It has two core features:

1. **Tailor Resume**: Adapts a user's master LaTeX resume template to a detected job posting, emphasizing real relevant skills and experience without ever fabricating facts.
2. **Find Recruiter**: Searches public sources via Google Search grounding to identify verified recruiters and talent acquisition leads, strictly refusing to guess or hallucinate email addresses.

---

## Architecture Overview

```text
┌────────────────────────────────────────────────────────┐
│                   Google Chrome                        │
│                                                        │
│  [ Job Posting Page: LinkedIn, Greenhouse, Lever ]     │
│             │                                          │
│             ▼                                          │
│     Content Script (detects pageText)                  │
│             │                                          │
│             ▼                                          │
│     Floating Widget (✦) OR Chrome Side Panel           │
│             │ (chrome.storage.local: facts, LaTeX)     │
└─────────────┼──────────────────────────────────────────┘
              │ HTTP (POST /api/...)
              ▼
┌────────────────────────────────────────────────────────┐
│             Local Express Backend Server               │
│                                                        │
│   • POST /api/jd/analyze                               │
│   • POST /api/resume/tailor                            │
│   • POST /api/recruiter/find                           │
│   • POST /api/resume/compile                           │
│                                                        │
│   Uses @google/genai with gemini-3.8-flash             │
│   (API Key strictly isolated in backend .env)          │
└────────────────────────────────────────────────────────┘
```

---

## Prerequisites

- **Node.js**: v18.0.0 or higher
- **Google Chrome**: Version 116+ (supports Chrome Side Panel API & Manifest V3)
- **Gemini API Key**: From [Google AI Studio](https://aistudio.google.com/)
- *(Optional)* **pdflatex**: For on-the-fly local PDF compilation. If not installed, you can still download the tailored `.tex` file directly and compile it with Overleaf or any LaTeX editor.

---

## Environment Variables

Copy `.env.example` to `.env` in the root and server directory:

```bash
cp .env.example .env
```

| Variable | Description | Default |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Your Google Gemini API Key | *(Required)* |
| `GEMINI_MODEL` | Gemini Model identifier | `gemini-3.8-flash` |
| `PORT` | Local server port | `3000` |
| `ALLOWED_ORIGIN`| Allowed CORS origin for extension | `*` |

> **Security Rule**: The Gemini API key resides **strictly on the backend server**. It is never stored in `chrome.storage` or sent over client-side code.

---

## Running the Backend

From the repository root:

```bash
# Install dependencies
npm install

# Start development server (serves API & live simulator on port 3000)
npm run dev

# Or run tests
npm test
```

Verify backend health at `http://localhost:3000/api/health`.

---

## Loading the Extension in Google Chrome

1. Build the extension bundle:
   ```bash
   cd extension
   npm install
   npm run build
   ```
2. Open Google Chrome and navigate to:
   ```text
   chrome://extensions
   ```
3. Enable **Developer mode** using the toggle switch in the top-right corner.
4. Click **Load unpacked** in the top-left corner.
5. Select the `extension/dist` folder (or click "Export Chrome Extension" in the web simulator).
6. Navigate to any job posting (e.g. LinkedIn, Greenhouse, Lever, Indeed).
7. Look for the floating **✦** button in the lower right, or open the Chrome Side Panel.

---

## Setting Up Master Resume & Facts

Click the **Settings** gear icon in the extension or floating widget:

1. **Profile**: Enter your contact details (Name, Email, Phone, LinkedIn, GitHub, Portfolio).
2. **Resume Facts**: Enter your verified technical skills, work history bullets, and project descriptions.
   > **Ground Truth Rule**: ApplyAI treats your resume facts as immutable ground truth. The model is constrained to reorder, emphasize, and filter facts, but is strictly forbidden from inventing roles, dates, or skills.
3. **Master LaTeX Template**: Paste your `.tex` code (e.g. standard Jake's Resume or Overleaf single-page template). ApplyAI preserves macro commands and structural styling.
4. **Backend URL**: By default points to `http://localhost:3000`.

---

## Limitations of Recruiter Email Discovery

- **Zero-Fabrication Guarantee**: ApplyAI will **never** generate, guess, or infer email addresses based on naming patterns (e.g. `first.last@company.com`).
- An email is only provided if it was explicitly published on a public, indexable source (company website, official recruiting page, press release, GitHub).
- If no public email exists, ApplyAI returns the recruiter's name, verified title, LinkedIn profile link, and relevant evidence, or falls back to the company's general careers contact (`careers@company.com`).

---

## Debugging

- **Check Server Logs**: Run `npm run dev` in a terminal to inspect request payloads and Gemini model calls.
- **Inspect Extension**: In Chrome, right-click the floating `✦` button or side panel and select **Inspect**. Check the Console tab for network errors or storage warnings.
- **Run Unit Tests**: Run `npm test` to verify JD validation, resume schema constraints, and recruiter parsers.
