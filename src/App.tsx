import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Server,
  Download,
  Layout,
  PanelRight,
  Settings as SettingsIcon,
  ExternalLink,
  Building2,
  MapPin,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  FileText,
  RefreshCw,
} from 'lucide-react';
import { FloatingWidget } from '../extension/src/components/FloatingWidget';
import { SidePanel } from '../extension/src/sidepanel/SidePanel';
import { SettingsPanel } from '../extension/src/components/SettingsPanel';
import { checkBackendHealth } from '../extension/src/api/client';
import { downloadExtensionZip } from './utils/exportExtension';

interface SampleJob {
  id: string;
  title: string;
  company: string;
  location: string;
  employmentType: string;
  description: string;
}

const SAMPLE_JOBS: SampleJob[] = [
  {
    id: 'stripe-fe',
    title: 'Frontend Infrastructure Engineer',
    company: 'Stripe',
    location: 'San Francisco, CA (Hybrid)',
    employmentType: 'Full-time',
    description: `About Stripe:
Stripe is a financial infrastructure platform for the internet. Millions of companies—from the world’s largest enterprises to the most ambitious startups—use Stripe to accept payments, grow their revenue, and accelerate new business opportunities.

About the Role:
We are looking for a Frontend Infrastructure Engineer to join our Core UI team. You will design, build, and maintain the foundational frontend frameworks, build systems, and design systems used across all Stripe user interfaces.

Key Responsibilities:
- Architect and optimize high-performance React component libraries and design systems.
- Build internal tooling, CI pipelines, and telemetry to improve developer velocity for 1,000+ engineers.
- Collaborate with security teams to implement client-side encryption and CSP standards.
- Drive performance initiatives focusing on Core Web Vitals (LCP, FID, CLS) and bundle size reduction.

What We're Looking For:
- 3+ years of professional software engineering experience with TypeScript and modern React.
- Strong knowledge of frontend tooling (Vite, Webpack, esbuild), browser internals, and web performance.
- Experience building component architectures, design systems, or data visualization workflows (ReactFlow, D3).
- Passion for developer experience, type safety, and clean code craftsmanship.`,
  },
  {
    id: 'linear-fs',
    title: 'Full Stack Engineer, Integrations',
    company: 'Linear',
    location: 'Remote (US/EU)',
    employmentType: 'Full-time',
    description: `About Linear:
Linear is a purpose-built tool for planning and building software. It's fast, keyboard-first, and designed with high craftsmanship.

About the Role:
We are looking for a Full Stack Engineer to lead our integrations and extensibility platform. You will build sync engines that connect Linear to GitHub, Slack, Figma, and developer APIs.

What You Will Do:
- Design real-time synchronization pipelines with sub-second event propagation.
- Implement robust TypeScript and Node.js backend services with high reliability and zero data loss.
- Craft snappy, tactile React UI components adhering strictly to Linear’s design standard.
- Maintain public developer SDKs and webhook architectures.

Qualifications:
- Deep experience with TypeScript, React, Node.js, and SQL databases.
- Prior experience building sync pipelines, asynchronous task runners, or developer tools.
- Obsession with speed, UI performance, and keyboard-driven workflows.`,
  },
  {
    id: 'custom-job',
    title: 'Custom Job Posting',
    company: 'Your Target Company',
    location: 'Remote',
    employmentType: 'Full-time',
    description: `Paste any job description from LinkedIn, Greenhouse, Lever, or Indeed here to test ApplyAI's real extraction, tailoring, and recruiter discovery engine.`,
  },
];

export default function App() {
  const [selectedJob, setSelectedJob] = useState<SampleJob>(SAMPLE_JOBS[0]);
  const [customText, setCustomText] = useState(SAMPLE_JOBS[0].description);
  const [viewMode, setViewMode] = useState<'floating' | 'sidepanel' | 'settings'>('floating');
  const [backendStatus, setBackendStatus] = useState<{
    ok: boolean;
    model: string;
    message?: string;
  } | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);

  // Poll backend health on mount
  useEffect(() => {
    checkBackendHealth()
      .then((health) => {
        setBackendStatus({
          ok: health.status === 'ok',
          model: health.model,
        });
      })
      .catch((err) => {
        setBackendStatus({
          ok: false,
          model: 'unknown',
          message: err.message,
        });
      });
  }, []);

  const handleSelectJob = (job: SampleJob) => {
    setSelectedJob(job);
    setCustomText(job.description);
  };

  const handleDownloadExtension = async () => {
    setIsDownloadingZip(true);
    try {
      await downloadExtensionZip();
    } catch (e) {
      console.error('Failed to export extension zip:', e);
    } finally {
      setIsDownloadingZip(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col font-sans">
      {/* Top Navigation & Status Bar */}
      <header className="h-14 border-b border-neutral-800 bg-neutral-900/90 backdrop-blur px-4 flex items-center justify-between shrink-0 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-neutral-100 text-neutral-950 flex items-center justify-center font-bold text-sm shadow-sm">
              ✦
            </span>
            <div className="flex flex-col">
              <span className="font-semibold text-sm tracking-tight text-neutral-100 flex items-center gap-2">
                ApplyAI
                <span className="text-[10px] font-mono font-normal px-1.5 py-0.2 bg-neutral-800 text-neutral-400 rounded">
                  v1.0.0 MV3
                </span>
              </span>
            </div>
          </div>

          <div className="hidden lg:flex items-center gap-1.5 ml-4 pl-4 border-l border-neutral-800 text-xs">
            <span className="text-neutral-400">Outputs:</span>
            <span className="text-neutral-300 font-medium">1. Tailored Resume</span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-300 font-medium">2. Updated LaTeX</span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-300 font-medium">3. Recruiter</span>
            <span className="text-neutral-600">•</span>
            <span className="text-neutral-300 font-medium">4. Outreach Email</span>
          </div>
        </div>

        {/* Center Mode Controls */}
        <div className="flex items-center bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs font-medium">
          <button
            id="view-mode-floating"
            onClick={() => setViewMode('floating')}
            className={`px-3 py-1 rounded flex items-center gap-1.5 transition-colors ${
              viewMode === 'floating'
                ? 'bg-neutral-800 text-neutral-100'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Job Page + Floating ✦</span>
          </button>
          <button
            id="view-mode-sidepanel"
            onClick={() => setViewMode('sidepanel')}
            className={`px-3 py-1 rounded flex items-center gap-1.5 transition-colors ${
              viewMode === 'sidepanel'
                ? 'bg-neutral-800 text-neutral-100'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <PanelRight className="w-3.5 h-3.5" />
            <span>Side Panel Mode</span>
          </button>
          <button
            id="view-mode-settings"
            onClick={() => setViewMode('settings')}
            className={`px-3 py-1 rounded flex items-center gap-1.5 transition-colors ${
              viewMode === 'settings'
                ? 'bg-neutral-800 text-neutral-100'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <SettingsIcon className="w-3.5 h-3.5" />
            <span>Master Resume & Facts</span>
          </button>
        </div>

        {/* Right Action & Backend Health */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 text-xs">
            {backendStatus?.ok ? (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Backend Online ({backendStatus.model})</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-400 text-[11px]">
                <Server className="w-3 h-3" />
                <span>Local Server</span>
              </span>
            )}
          </div>

          <button
            id="download-extension-zip-btn"
            onClick={handleDownloadExtension}
            disabled={isDownloadingZip}
            className="px-3 py-1.5 bg-neutral-100 hover:bg-white text-neutral-950 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all active:scale-[0.98]"
            title="Download unpacked Chrome extension to load via chrome://extensions"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isDownloadingZip ? 'Packaging...' : 'Export Chrome Extension'}</span>
          </button>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden">
        {viewMode === 'settings' ? (
          /* Full Screen Settings View */
          <div className="flex-1 max-w-4xl mx-auto w-full p-6 overflow-y-auto">
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-xl h-[80vh] flex flex-col">
              <SettingsPanel onBack={() => setViewMode('floating')} />
            </div>
          </div>
        ) : (
          /* Interactive Job Simulation Workspace */
          <div className="flex-1 flex overflow-hidden">
            {/* Left: Job Page Simulator */}
            <main className="flex-1 flex flex-col border-r border-neutral-800/80 bg-neutral-950 overflow-y-auto relative">
              {/* Mock Browser URL Bar */}
              <div className="h-10 border-b border-neutral-800/80 bg-neutral-900/60 px-4 flex items-center justify-between text-xs text-neutral-400 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                    <div className="w-2.5 h-2.5 rounded-full bg-neutral-700" />
                  </div>
                  <div className="flex items-center gap-1 bg-neutral-950 border border-neutral-800 px-3 py-0.5 rounded text-[11px] text-neutral-300 font-mono max-w-md truncate">
                    <span>https://jobs.{selectedJob.company.toLowerCase().replace(/[^a-z0-9]/g, '')}.com/roles/{selectedJob.id}</span>
                  </div>
                </div>

                {/* Job Preset Selector */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] text-neutral-400">Sample Posting:</span>
                  <div className="flex gap-1">
                    {SAMPLE_JOBS.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => handleSelectJob(job)}
                        className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors ${
                          selectedJob.id === job.id
                            ? 'bg-neutral-800 text-neutral-100 border border-neutral-700'
                            : 'text-neutral-400 hover:text-neutral-300'
                        }`}
                      >
                        {job.company}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Rendered Job Posting Document */}
              <div className="p-8 max-w-3xl mx-auto w-full space-y-6">
                <div className="space-y-2 pb-6 border-b border-neutral-800">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                      Careers at {selectedJob.company}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-400 font-mono">
                      {selectedJob.employmentType}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold text-neutral-100 tracking-tight">
                    {selectedJob.title}
                  </h1>
                  <div className="flex items-center gap-4 text-xs text-neutral-400">
                    <span className="flex items-center gap-1.5 text-neutral-300">
                      <Building2 className="w-3.5 h-3.5 text-neutral-500" />
                      {selectedJob.company}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-neutral-500" />
                      {selectedJob.location}
                    </span>
                  </div>
                </div>

                {/* Editable / Viewable Job Description Text */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-neutral-400">
                    <span className="font-medium text-neutral-300">Job Description Content</span>
                    <span className="text-[11px]">
                      {selectedJob.id === 'custom-job' ? 'Editable — paste any job text' : 'Live extracted text'}
                    </span>
                  </div>
                  {selectedJob.id === 'custom-job' ? (
                    <textarea
                      id="custom-job-textarea"
                      rows={14}
                      value={customText}
                      onChange={(e) => setCustomText(e.target.value)}
                      placeholder="Paste any job description from LinkedIn, Greenhouse, Lever..."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-xs text-neutral-200 leading-relaxed font-mono focus:outline-none focus:border-neutral-700"
                    />
                  ) : (
                    <div className="bg-neutral-900/60 border border-neutral-800/80 rounded-xl p-5 text-xs text-neutral-300 leading-relaxed whitespace-pre-line font-normal selection:bg-neutral-800">
                      {customText}
                    </div>
                  )}
                </div>

                {/* Helper Banner for Developer Experience */}
                <div className="p-4 bg-neutral-900/40 border border-neutral-800 rounded-xl flex items-start gap-3 text-xs text-neutral-400">
                  <div className="w-6 h-6 rounded-md bg-neutral-800 flex items-center justify-center shrink-0 mt-0.5 text-neutral-200 font-bold">
                    ✦
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-200">How to test ApplyAI right now:</p>
                    <ol className="list-decimal list-inside space-y-1 mt-1 text-[11px] text-neutral-400">
                      <li>Click the floating <strong className="text-neutral-200">✦</strong> button in the bottom right corner (or switch to Side Panel mode).</li>
                      <li>Click <strong className="text-neutral-200">Tailor Resume</strong> to customize the LaTeX template against this job with zero invented facts.</li>
                      <li>Click <strong className="text-neutral-200">Find Recruiter</strong> to search public Google sources for verified recruiters and contacts.</li>
                      <li>Click <strong className="text-neutral-200">Export Chrome Extension</strong> to load this extension unpacked in your personal browser.</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Floating Widget Injected into Simulated Web Page */}
              {viewMode === 'floating' && (
                <FloatingWidget
                  defaultOpen={false}
                  pageTextProvider={() => ({
                    pageText: customText,
                    title: `${selectedJob.title} at ${selectedJob.company}`,
                    url: `https://jobs.${selectedJob.company.toLowerCase()}.com/roles/${selectedJob.id}`,
                  })}
                />
              )}
            </main>

            {/* Right: Side Panel View Mode */}
            {viewMode === 'sidepanel' && (
              <aside className="w-[380px] border-l border-neutral-800 bg-neutral-900 flex flex-col shrink-0">
                <SidePanel />
              </aside>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
