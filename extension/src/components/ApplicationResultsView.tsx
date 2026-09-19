import React, { useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  FileCode,
  FileText,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  UserCheck,
  AlertCircle,
  AlertTriangle,
  Send,
  Eye,
  Settings,
} from 'lucide-react';
import {
  JobDescription,
  TailoredResumeResult,
  RecruiterSearchResponse,
  TailoredEmailResult,
} from '../types';
import { compilePdfApi } from '../api/client';
import { LoadingState } from './LoadingState';

interface ApplicationResultsViewProps {
  job: JobDescription;
  // Tailor Resume State
  tailorResult: TailoredResumeResult | null;
  isTailoring: boolean;
  tailorError: string | null;
  onTailorResume: () => void;

  // Recruiter Search State
  recruiterResult: RecruiterSearchResponse | null;
  isSearchingRecruiter: boolean;
  recruiterError: string | null;
  onFindRecruiter: () => void;

  // Outreach Email State
  emailResult: TailoredEmailResult | null;
  isGeneratingEmail: boolean;
  emailError: string | null;
  onGenerateEmail: () => void;

  // Combined action
  onRunAll: () => void;

  // Navigation
  onBack: () => void;
  onOpenSettings: () => void;
}

export const ApplicationResultsView: React.FC<ApplicationResultsViewProps> = ({
  job,
  tailorResult,
  isTailoring,
  tailorError,
  onTailorResume,
  recruiterResult,
  isSearchingRecruiter,
  recruiterError,
  onFindRecruiter,
  emailResult,
  isGeneratingEmail,
  emailError,
  onGenerateEmail,
  onRunAll,
  onBack,
  onOpenSettings,
}) => {
  // UI toggles
  const [showChangesModal, setShowChangesModal] = useState(false);
  const [showLatexViewer, setShowLatexViewer] = useState(false);
  const [copiedTex, setCopiedTex] = useState(false);
  const [copiedRecruiterEmail, setCopiedRecruiterEmail] = useState<string | null>(null);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedEmailBody, setCopiedEmailBody] = useState(false);
  const [isCompilingPdf, setIsCompilingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  // LaTeX Download
  const handleDownloadTex = () => {
    if (!tailorResult?.updatedLatex) return;
    const blob = new Blob([tailorResult.updatedLatex], { type: 'text/x-tex;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const companyClean = (job.company || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
    const titleClean = job.title.replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `Resume_${companyClean}_${titleClean}.tex`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // LaTeX Copy
  const handleCopyTex = async () => {
    if (!tailorResult?.updatedLatex) return;
    try {
      await navigator.clipboard.writeText(tailorResult.updatedLatex);
      setCopiedTex(true);
      setTimeout(() => setCopiedTex(false), 2000);
    } catch (e) {
      console.error('Failed to copy LaTeX code:', e);
    }
  };

  // PDF Compilation & Download
  const handleDownloadPdf = async () => {
    if (!tailorResult?.updatedLatex) return;
    setIsCompilingPdf(true);
    setPdfError(null);
    try {
      const blob = await compilePdfApi(tailorResult.updatedLatex);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const companyClean = (job.company || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
      const titleClean = job.title.replace(/[^a-zA-Z0-9]/g, '_');
      a.download = `Resume_${companyClean}_${titleClean}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(
        err instanceof Error
          ? err.message
          : 'PDF compilation is not available on this server. Please download the .tex file to compile via Overleaf.'
      );
    } finally {
      setIsCompilingPdf(false);
    }
  };

  // Recruiter Email Copy
  const handleCopyRecruiterEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedRecruiterEmail(email);
      setTimeout(() => setCopiedRecruiterEmail(null), 2000);
    } catch (e) {
      console.error('Failed to copy email:', e);
    }
  };

  // Outreach Email Copy Subject
  const handleCopySubject = async () => {
    if (!emailResult?.subject) return;
    try {
      await navigator.clipboard.writeText(emailResult.subject);
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } catch (e) {
      console.error('Failed to copy subject:', e);
    }
  };

  // Outreach Email Copy Body
  const handleCopyEmailBody = async () => {
    if (!emailResult?.body) return;
    try {
      await navigator.clipboard.writeText(emailResult.body);
      setCopiedEmailBody(true);
      setTimeout(() => setCopiedEmailBody(false), 2000);
    } catch (e) {
      console.error('Failed to copy email body:', e);
    }
  };

  // Save / Download Email as text file
  const handleSaveEmail = () => {
    if (!emailResult) return;
    const content = `Subject: ${emailResult.subject}\n\n${emailResult.body}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const companyClean = (job.company || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
    a.download = `Outreach_Email_${companyClean}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Format concise change bullets
  const changeBullets: string[] =
    tailorResult?.changesSummary && tailorResult.changesSummary.length > 0
      ? tailorResult.changesSummary
      : tailorResult?.changes
      ? tailorResult.changes.map((c) => c.description || c.change || `${c.type}: ${c.section}`).slice(0, 6)
      : [];

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-100 text-sm select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-neutral-800 shrink-0">
        <div className="flex items-center gap-2">
          <button
            id="applyai-results-back-btn"
            onClick={onBack}
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
            title="Back to Job Analysis"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <div className="flex flex-col">
            <span className="font-semibold text-neutral-200 text-xs">Application Package</span>
            <span className="text-[10px] text-neutral-400 truncate max-w-[170px]">
              {job.company || 'Company'} • {job.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            id="applyai-results-run-all-btn"
            onClick={onRunAll}
            disabled={isTailoring || isSearchingRecruiter || isGeneratingEmail}
            className="px-2 py-1 text-[11px] font-medium bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded border border-neutral-700 flex items-center gap-1 transition-all disabled:opacity-50"
            title="Re-run entire application pipeline"
          >
            <RefreshCw
              className={`w-3 h-3 ${
                isTailoring || isSearchingRecruiter || isGeneratingEmail ? 'animate-spin' : ''
              }`}
            />
            <span>Run All</span>
          </button>
          <button
            id="applyai-results-settings-btn"
            onClick={onOpenSettings}
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
            title="Settings"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Scrollable Content */}
      <div className="p-3.5 space-y-4 flex-1 overflow-y-auto">
        {/* Job Details Card */}
        <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-lg space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h3 className="font-semibold text-neutral-100 text-sm leading-snug">
                {job.title}
              </h3>
              <p className="text-xs text-neutral-300 flex items-center gap-1 mt-0.5">
                <Building2 className="w-3 h-3 text-neutral-400" />
                <span>{job.company || 'Company'}</span>
                {job.location && (
                  <>
                    <span className="text-neutral-600">•</span>
                    <span className="text-neutral-400">{job.location}</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Trigger Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1 border-t border-neutral-800/80">
            <button
              id="applyai-results-tailor-btn"
              onClick={onTailorResume}
              disabled={isTailoring}
              className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium rounded border border-neutral-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Sparkles className="w-3 h-3 text-neutral-300" />
              <span>{isTailoring ? 'Tailoring...' : tailorResult ? 'Re-Tailor' : 'Tailor Resume'}</span>
            </button>
            <button
              id="applyai-results-recruiter-btn"
              onClick={onFindRecruiter}
              disabled={isSearchingRecruiter}
              className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-[11px] font-medium rounded border border-neutral-700 flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <Search className="w-3 h-3 text-neutral-300" />
              <span>{isSearchingRecruiter ? 'Searching...' : recruiterResult ? 'Re-Search' : 'Find Recruiter'}</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* OUTPUT 1: TAILORED RESUME */}
        {/* ========================================================= */}
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <h4 className="font-semibold text-neutral-100 text-xs tracking-wider uppercase">
                1. Tailored Resume
              </h4>
            </div>
            {tailorResult && (
              <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-mono">
                <ShieldCheck className="w-3 h-3" />
                <span>Source of Truth Intact</span>
              </span>
            )}
          </div>

          {isTailoring ? (
            <div className="py-4">
              <LoadingState
                steps={[
                  'Analyzing job description keywords...',
                  'Selecting relevant projects and skills...',
                  'Rewriting bullets for high JD emphasis...',
                  'Validating zero-fabrication constraints...',
                ]}
                stepIntervalMs={1600}
              />
            </div>
          ) : tailorError ? (
            <div className="p-2.5 rounded bg-red-950/40 border border-red-900/40 text-red-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span>Tailoring Failed</span>
              </div>
              <p className="text-[11px] text-red-400/90">{tailorError}</p>
              <button
                id="applyai-retry-tailor-btn"
                onClick={onTailorResume}
                className="mt-1 text-[11px] underline text-red-300 hover:text-white"
              >
                Try Again
              </button>
            </div>
          ) : tailorResult ? (
            <div className="space-y-2.5">
              {/* Concise Change Summary */}
              <div className="p-2.5 bg-neutral-900/80 rounded border border-neutral-800 space-y-1.5">
                <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                  Changes Made
                </div>
                <div className="space-y-1">
                  {changeBullets.length > 0 ? (
                    changeBullets.map((bullet, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 text-[11px] text-neutral-300">
                        <span className="text-emerald-400 font-bold shrink-0">✓</span>
                        <span className="leading-snug">{bullet}</span>
                      </div>
                    ))
                  ) : (
                    <div className="flex items-start gap-1.5 text-[11px] text-neutral-300">
                      <span className="text-emerald-400 font-bold shrink-0">✓</span>
                      <span>Emphasized matching skills and experiences for this role.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons: [View Changes] and [Download Resume] */}
              <div className="flex items-center gap-2 pt-0.5">
                <button
                  id="applyai-view-changes-btn"
                  onClick={() => setShowChangesModal(!showChangesModal)}
                  className="flex-1 py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded border border-neutral-700 flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{showChangesModal ? 'Hide Details' : 'View Changes'}</span>
                </button>

                <button
                  id="applyai-download-resume-btn"
                  disabled={isCompilingPdf}
                  onClick={handleDownloadPdf}
                  className="flex-1 py-1.5 px-2 bg-neutral-100 hover:bg-white text-neutral-950 text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-[0.99] disabled:opacity-50"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isCompilingPdf ? 'Compiling PDF...' : 'Download Resume'}</span>
                </button>
              </div>

              {/* PDF Error / Tip */}
              {pdfError && (
                <div className="p-2 rounded bg-amber-950/30 border border-amber-900/40 text-[11px] text-amber-300 space-y-1">
                  <p className="font-medium">{pdfError}</p>
                  <p className="text-[10px] text-amber-400/80">
                    Use <strong>Download .tex</strong> below to compile instantly on Overleaf or your local TeX distribution.
                  </p>
                </div>
              )}

              {/* Detailed Changes & Overlap Drawer */}
              {showChangesModal && (
                <div className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-lg space-y-3 text-xs animate-in fade-in duration-150">
                  {/* Matched skills */}
                  {tailorResult.resumeAnalysis.matchedSkills?.length > 0 && (
                    <div>
                      <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider mb-1">
                        Matched Skills ({tailorResult.resumeAnalysis.matchedSkills.length})
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {tailorResult.resumeAnalysis.matchedSkills.map((s, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-950/70 text-emerald-300 border border-emerald-800/60 rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Missing in resume strictly omitted */}
                  {tailorResult.resumeAnalysis.missingTechnologies?.length > 0 && (
                    <div className="p-2 bg-amber-950/20 border border-amber-900/30 rounded space-y-1">
                      <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                        <AlertTriangle className="w-3 h-3" />
                        <span>JD Technologies Absent in Resume — Strictly Omitted</span>
                      </div>
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {tailorResult.resumeAnalysis.missingTechnologies.map((m, i) => (
                          <span
                            key={i}
                            className="px-1.5 py-0.5 text-[10px] font-mono bg-amber-950/50 text-amber-300 border border-amber-800/40 rounded line-through opacity-80"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                      <p className="text-[9px] text-amber-400/80">
                        Zero fabrication: omitted to keep resume 100% truthful.
                      </p>
                    </div>
                  )}

                  {/* Traceable Changes Breakdown */}
                  <div>
                    <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider mb-1">
                      Detailed Traceable Log ({tailorResult.changes.length})
                    </div>
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {tailorResult.changes.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-1.5 rounded bg-neutral-950/60 border border-neutral-800 space-y-0.5 text-[11px]"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-semibold text-neutral-200 text-[10px]">
                              {item.section}
                            </span>
                            <span className="text-[9px] font-mono uppercase px-1 py-0.2 rounded bg-neutral-800 text-neutral-400">
                              {item.type}
                            </span>
                          </div>
                          <p className="text-neutral-300 leading-snug">
                            {item.description || item.change}
                          </p>
                          {item.reason && (
                            <p className="text-[10px] text-neutral-400 italic">{item.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-neutral-900/40 border border-dashed border-neutral-800 rounded text-center space-y-1.5">
              <p className="text-xs text-neutral-400">Resume not tailored yet.</p>
              <button
                id="applyai-start-tailoring-btn"
                onClick={onTailorResume}
                className="py-1 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded transition-colors"
              >
                Tailor Resume
              </button>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* OUTPUT 2: UPDATED LATEX */}
        {/* ========================================================= */}
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-sky-400" />
              <h4 className="font-semibold text-neutral-100 text-xs tracking-wider uppercase">
                2. Updated LaTeX
              </h4>
            </div>
            {tailorResult?.updatedLatex && (
              <span className="text-[10px] text-sky-400 font-mono">
                Overleaf Format Preserved
              </span>
            )}
          </div>

          {tailorResult?.updatedLatex ? (
            <div className="space-y-2">
              <p className="text-[11px] text-neutral-400 leading-relaxed">
                All document classes, custom macros, styling, and formatting preserved.
              </p>

              {/* Action Buttons: [View], [Copy], [Download .tex] */}
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  id="applyai-latex-view-btn"
                  onClick={() => setShowLatexViewer(!showLatexViewer)}
                  className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium rounded border border-neutral-700 flex items-center justify-center gap-1 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{showLatexViewer ? 'Hide' : 'View'}</span>
                </button>

                <button
                  id="applyai-latex-copy-btn"
                  onClick={handleCopyTex}
                  className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium rounded border border-neutral-700 flex items-center justify-center gap-1 transition-colors"
                >
                  {copiedTex ? (
                    <>
                      <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Copy</span>
                    </>
                  )}
                </button>

                <button
                  id="applyai-latex-download-btn"
                  onClick={handleDownloadTex}
                  className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium rounded border border-neutral-700 flex items-center justify-center gap-1 transition-colors"
                  title="Download .tex file for Overleaf"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Download .tex</span>
                </button>
              </div>

              {/* Collapsible LaTeX Preview */}
              {showLatexViewer && (
                <div className="p-2.5 rounded bg-neutral-950 border border-neutral-800 text-[10px] font-mono text-neutral-300 max-h-48 overflow-y-auto select-text whitespace-pre-wrap">
                  {tailorResult.updatedLatex}
                </div>
              )}
            </div>
          ) : (
            <div className="p-3 bg-neutral-900/40 border border-dashed border-neutral-800 rounded text-center">
              <p className="text-xs text-neutral-400">
                Generate the tailored resume above to view and download updated LaTeX.
              </p>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* OUTPUT 3: RECRUITER CONTACT */}
        {/* ========================================================= */}
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <h4 className="font-semibold text-neutral-100 text-xs tracking-wider uppercase">
                3. Recruiter
              </h4>
            </div>
            {recruiterResult?.recruiters && recruiterResult.recruiters.length > 0 && (
              <span className="text-[10px] text-purple-400 font-mono">
                {recruiterResult.recruiters.length} Found
              </span>
            )}
          </div>

          {isSearchingRecruiter ? (
            <div className="py-4">
              <LoadingState
                steps={[
                  'Searching public company talent sources...',
                  'Locating verified technical recruiters...',
                  'Validating public emails with strict zero-guess policy...',
                ]}
                stepIntervalMs={1600}
              />
            </div>
          ) : recruiterError ? (
            <div className="p-2.5 rounded bg-red-950/40 border border-red-900/40 text-red-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span>Search Failed</span>
              </div>
              <p className="text-[11px] text-red-400/90">{recruiterError}</p>
              <button
                id="applyai-retry-recruiter-btn"
                onClick={onFindRecruiter}
                className="mt-1 text-[11px] underline text-red-300 hover:text-white"
              >
                Try Again
              </button>
            </div>
          ) : recruiterResult ? (
            <div className="space-y-3">
              {recruiterResult.recruiters.length === 0 ? (
                <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded text-xs space-y-2">
                  <p className="text-neutral-300">
                    No clearly identifiable recruiter found publicly for {job.company || 'this company'}.
                  </p>
                  {recruiterResult.generalContactEmail && (
                    <div className="flex items-center justify-between p-2 bg-neutral-950 rounded border border-neutral-800">
                      <span className="font-mono text-neutral-300 text-[11px]">
                        {recruiterResult.generalContactEmail}
                      </span>
                      <button
                        id="applyai-copy-general-recruiter-email-btn"
                        onClick={() => handleCopyRecruiterEmail(recruiterResult.generalContactEmail!)}
                        className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1"
                      >
                        {copiedRecruiterEmail === recruiterResult.generalContactEmail ? (
                          <CheckCheck className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>Copy</span>
                      </button>
                    </div>
                  )}
                  {recruiterResult.notes && (
                    <p className="text-[10px] text-neutral-400 italic">{recruiterResult.notes}</p>
                  )}
                </div>
              ) : (
                recruiterResult.recruiters.map((recruiter, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-lg space-y-2 text-xs"
                  >
                    {/* Name & Role */}
                    <div className="flex items-start justify-between gap-1.5">
                      <div>
                        <div className="font-semibold text-neutral-100 flex items-center gap-1.5">
                          <UserCheck className="w-3.5 h-3.5 text-neutral-300" />
                          <span>{recruiter.name}</span>
                        </div>
                        {recruiter.title && (
                          <p className="text-[11px] text-neutral-300 mt-0.5">{recruiter.title}</p>
                        )}
                        {recruiter.company && (
                          <p className="text-[10px] text-neutral-400 flex items-center gap-1 mt-0.5">
                            <Building2 className="w-2.5 h-2.5 text-neutral-500" />
                            <span>{recruiter.company}</span>
                          </p>
                        )}
                      </div>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-neutral-800 text-neutral-300 border border-neutral-700">
                        {recruiter.confidence}
                      </span>
                    </div>

                    {/* Email with strict zero fabrication */}
                    <div className="p-2 bg-neutral-950 rounded border border-neutral-800 text-[11px]">
                      {recruiter.email ? (
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-emerald-300 select-all truncate max-w-[190px]">
                            {recruiter.email}
                          </span>
                          <button
                            id={`applyai-copy-recruiter-email-${idx}`}
                            onClick={() => handleCopyRecruiterEmail(recruiter.email!)}
                            className="flex items-center gap-1 text-[10px] font-medium text-neutral-300 hover:text-white px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors"
                          >
                            {copiedRecruiterEmail === recruiter.email ? (
                              <>
                                <CheckCheck className="w-3 h-3 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy Email</span>
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-neutral-400 text-[11px] italic">
                          Public email not found.
                        </span>
                      )}
                    </div>

                    {/* Evidence */}
                    {recruiter.evidence && (
                      <p className="text-[11px] text-neutral-400 leading-snug">
                        {recruiter.evidence}
                      </p>
                    )}

                    {/* Links: LinkedIn & Sources */}
                    <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/80 text-[11px]">
                      {recruiter.linkedin && (
                        <a
                          id={`applyai-recruiter-linkedin-${idx}`}
                          href={recruiter.linkedin}
                          target="_blank"
                          rel="noreferrer"
                          className="text-neutral-300 hover:text-white flex items-center gap-1 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3 text-neutral-400" />
                          <span>LinkedIn</span>
                        </a>
                      )}
                      {recruiter.sourceUrls?.length > 0 && (
                        <a
                          id={`applyai-recruiter-source-${idx}`}
                          href={recruiter.sourceUrls[0]}
                          target="_blank"
                          rel="noreferrer"
                          className="text-neutral-400 hover:text-neutral-200 flex items-center gap-1 ml-auto transition-colors"
                        >
                          <span>Sources</span>
                          <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                        </a>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="p-3 bg-neutral-900/40 border border-dashed border-neutral-800 rounded text-center space-y-1.5">
              <p className="text-xs text-neutral-400">Recruiter research not performed yet.</p>
              <button
                id="applyai-start-recruiter-btn"
                onClick={onFindRecruiter}
                className="py-1 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded transition-colors"
              >
                Find Recruiter
              </button>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* OUTPUT 4: TAILORED OUTREACH EMAIL */}
        {/* ========================================================= */}
        <div className="bg-neutral-950/60 border border-neutral-800 rounded-lg p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <h4 className="font-semibold text-neutral-100 text-xs tracking-wider uppercase">
                4. Outreach Email
              </h4>
            </div>
            {emailResult && (
              <span className="text-[10px] text-amber-400 font-mono">
                Factually Grounded
              </span>
            )}
          </div>

          {isGeneratingEmail ? (
            <div className="py-4">
              <LoadingState
                steps={[
                  'Analyzing role requirements and candidate experience...',
                  'Crafting direct, non-generic pitch without AI clichés...',
                  'Verifying all mentioned technologies match candidate stack...',
                ]}
                stepIntervalMs={1500}
              />
            </div>
          ) : emailError ? (
            <div className="p-2.5 rounded bg-red-950/40 border border-red-900/40 text-red-300 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                <span>Email Generation Failed</span>
              </div>
              <p className="text-[11px] text-red-400/90">{emailError}</p>
              <button
                id="applyai-retry-email-btn"
                onClick={onGenerateEmail}
                className="mt-1 text-[11px] underline text-red-300 hover:text-white"
              >
                Try Again
              </button>
            </div>
          ) : emailResult ? (
            <div className="space-y-2.5">
              {/* Subject Line */}
              <div className="p-2 bg-neutral-900 rounded border border-neutral-800 space-y-1">
                <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <span>Subject</span>
                  <button
                    id="applyai-copy-subject-btn"
                    onClick={handleCopySubject}
                    className="text-neutral-400 hover:text-white flex items-center gap-1 text-[10px]"
                  >
                    {copiedSubject ? (
                      <>
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Subject</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-xs text-neutral-200 font-medium select-all">
                  {emailResult.subject}
                </p>
              </div>

              {/* Email Body */}
              <div className="p-3 bg-neutral-900 rounded border border-neutral-800 space-y-2">
                <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                  <span>Email Body</span>
                  <button
                    id="applyai-copy-body-btn"
                    onClick={handleCopyEmailBody}
                    className="text-neutral-400 hover:text-white flex items-center gap-1 text-[10px]"
                  >
                    {copiedEmailBody ? (
                      <>
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                        <span className="text-emerald-400">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        <span>Copy Email</span>
                      </>
                    )}
                  </button>
                </div>
                <div className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line select-text font-normal font-sans bg-neutral-950/40 p-2.5 rounded border border-neutral-800/80">
                  {emailResult.body}
                </div>
              </div>

              {/* Actions: [Copy Subject], [Copy Email], [Download / Save Email] */}
              <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                <button
                  id="applyai-email-action-copy-sub"
                  onClick={handleCopySubject}
                  className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium rounded border border-neutral-700 flex items-center justify-center gap-1 transition-colors"
                >
                  {copiedSubject ? (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                  <span>Copy Subject</span>
                </button>

                <button
                  id="applyai-email-action-copy-body"
                  onClick={handleCopyEmailBody}
                  className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium rounded border border-neutral-700 flex items-center justify-center gap-1 transition-colors"
                >
                  {copiedEmailBody ? (
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5 text-neutral-400" />
                  )}
                  <span>Copy Email</span>
                </button>

                <button
                  id="applyai-email-action-save"
                  onClick={handleSaveEmail}
                  className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-xs font-medium rounded border border-neutral-700 flex items-center justify-center gap-1 transition-colors"
                  title="Download email as text file"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Save Email</span>
                </button>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  id="applyai-regenerate-email-btn"
                  onClick={onGenerateEmail}
                  className="text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Regenerate Email</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-3 bg-neutral-900/40 border border-dashed border-neutral-800 rounded text-center space-y-1.5">
              <p className="text-xs text-neutral-400">
                Generate tailored outreach email personalized for this job and verified recruiter.
              </p>
              <button
                id="applyai-start-email-btn"
                onClick={onGenerateEmail}
                className="py-1 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded transition-colors"
              >
                Generate Outreach Email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
