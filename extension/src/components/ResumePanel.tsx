import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  FileCode,
  FileText,
  AlertCircle,
  Copy,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
  Sparkles,
  Layers,
  AlertTriangle,
  Mail,
  Download,
} from 'lucide-react';
import { TailoredResumeResult, JobDescription, TailoredEmailResult } from '../types';
import { LoadingState } from './LoadingState';
import { compilePdfApi } from '../api/client';

interface ResumePanelProps {
  job: JobDescription;
  tailorResult: TailoredResumeResult | null;
  isLoading: boolean;
  error: string | null;
  emailResult?: TailoredEmailResult | null;
  isGeneratingEmail?: boolean;
  emailError?: string | null;
  onGenerateEmail?: () => void;
  onBack: () => void;
  onRetry: () => void;
}

export const ResumePanel: React.FC<ResumePanelProps> = ({
  job,
  tailorResult,
  isLoading,
  error,
  emailResult,
  isGeneratingEmail,
  emailError,
  onGenerateEmail,
  onBack,
  onRetry,
}) => {
  const [showChanges, setShowChanges] = useState(true);
  const [showAnalysis, setShowAnalysis] = useState(true);
  const [showLatexCode, setShowLatexCode] = useState(false);
  const [isCompilingPdf, setIsCompilingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [copiedTex, setCopiedTex] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);
  const [copiedEmailBody, setCopiedEmailBody] = useState(false);

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

  const handleSaveEmail = () => {
    if (!emailResult) return;
    const content = `Subject: ${emailResult.subject}\n\n${emailResult.body}`;
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeCompany = (job.company || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.download = `Outreach_Email_${safeCompany}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadTex = () => {
    if (!tailorResult) return;
    const blob = new Blob([tailorResult.updatedLatex], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeCompany = (job.company || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
    const safeRole = (job.title || 'Role').replace(/[^a-zA-Z0-9]/g, '_');
    link.href = url;
    link.download = `Resume_${safeCompany}_${safeRole}.tex`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPdf = async () => {
    if (!tailorResult) return;
    setIsCompilingPdf(true);
    setPdfError(null);
    try {
      const pdfBlob = await compilePdfApi(tailorResult.updatedLatex);
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      const safeCompany = (job.company || 'Company').replace(/[^a-zA-Z0-9]/g, '_');
      const safeRole = (job.title || 'Role').replace(/[^a-zA-Z0-9]/g, '_');
      link.href = url;
      link.download = `Resume_${safeCompany}_${safeRole}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'PDF compilation failed.';
      setPdfError(msg);
    } finally {
      setIsCompilingPdf(false);
    }
  };

  const handleCopyTex = async () => {
    if (!tailorResult) return;
    try {
      await navigator.clipboard.writeText(tailorResult.updatedLatex);
      setCopiedTex(true);
      setTimeout(() => setCopiedTex(false), 2000);
    } catch (e) {
      console.error('Failed to copy LaTeX code:', e);
    }
  };

  const getTypeBadgeStyle = (type: string) => {
    switch (type.toLowerCase()) {
      case 'rewrite':
        return 'bg-sky-950/60 text-sky-300 border-sky-800/60';
      case 'reorder':
        return 'bg-indigo-950/60 text-indigo-300 border-indigo-800/60';
      case 'emphasis':
        return 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60';
      case 'prune':
        return 'bg-amber-950/60 text-amber-300 border-amber-800/60';
      default:
        return 'bg-neutral-800 text-neutral-300 border-neutral-700';
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-100 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            id="applyai-resume-back-btn"
            onClick={onBack}
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
            title="Back to Job Overview"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-semibold text-neutral-200 text-xs">Tailor Resume</span>
        </div>
        <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[140px]">
          {job.title}
        </span>
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-3.5 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="py-8">
            <LoadingState
              steps={[
                'Understanding master resume facts & stack...',
                'Analyzing job description requirements...',
                'Identifying truthful skill & technology overlap...',
                'Emphasizing existing experience without fabrication...',
                'Preserving LaTeX template macros & formatting...',
              ]}
              stepIntervalMs={1600}
            />
          </div>
        ) : error ? (
          <div className="space-y-3 py-4">
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/40 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-medium">Tailoring Failed</p>
                <p className="mt-1 text-[11px] text-red-400/90">{error}</p>
              </div>
            </div>
            <button
              id="applyai-resume-retry-btn"
              onClick={onRetry}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : tailorResult ? (
          <div className="space-y-3.5">
            {/* Source of Truth Banner */}
            <div className="p-2.5 bg-neutral-950/70 border border-emerald-900/40 rounded-lg text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-medium text-emerald-400 text-[11px]">
                  <ShieldCheck className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Master Resume Protected</span>
                </span>
                <span className="text-[10px] font-mono text-neutral-400">
                  {tailorResult.changes.length} adjustments
                </span>
              </div>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Your original master resume remains completely untouched. The tailored copy emphasizes matching facts from your existing profile.
              </p>
            </div>

            {/* Concise Changes Made Summary */}
            <div className="p-2.5 bg-neutral-900/90 rounded-lg border border-neutral-800 space-y-1.5">
              <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                Changes Made
              </div>
              <div className="space-y-1">
                {(tailorResult.changesSummary && tailorResult.changesSummary.length > 0
                  ? tailorResult.changesSummary
                  : tailorResult.changes.map((c) => c.description || c.change || `${c.type}: ${c.section}`).slice(0, 6)
                ).map((bullet, idx) => (
                  <div key={idx} className="flex items-start gap-1.5 text-[11px] text-neutral-300">
                    <span className="text-emerald-400 font-bold shrink-0">✓</span>
                    <span className="leading-snug">{bullet}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Overlap & Match Analysis Accordion */}
            {tailorResult.resumeAnalysis && (
              <div className="border border-neutral-800 rounded-lg bg-neutral-950/50 overflow-hidden">
                <button
                  id="applyai-toggle-analysis-btn"
                  onClick={() => setShowAnalysis(!showAnalysis)}
                  className="w-full px-3 py-2 flex items-center justify-between text-xs text-neutral-300 font-medium hover:bg-neutral-800/40 transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Keyword & Stack Overlap</span>
                  </span>
                  {showAnalysis ? (
                    <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                  )}
                </button>

                {showAnalysis && (
                  <div className="p-3 pt-2 border-t border-neutral-800/80 space-y-3 text-xs">
                    {/* Matched Skills */}
                    {tailorResult.resumeAnalysis.matchedSkills?.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider mb-1.5">
                          Matched Skills ({tailorResult.resumeAnalysis.matchedSkills.length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {tailorResult.resumeAnalysis.matchedSkills.map((s, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 text-[10px] font-medium bg-emerald-950/60 text-emerald-300 border border-emerald-800/50 rounded"
                            >
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Matched Technologies */}
                    {tailorResult.resumeAnalysis.matchedTechnologies?.length > 0 && (
                      <div>
                        <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider mb-1.5">
                          Matched Technologies ({tailorResult.resumeAnalysis.matchedTechnologies.length})
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {tailorResult.resumeAnalysis.matchedTechnologies.map((t, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 text-[10px] font-mono bg-neutral-800 text-neutral-200 border border-neutral-700 rounded"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing Technologies (Omitted Rule) */}
                    {tailorResult.resumeAnalysis.missingTechnologies?.length > 0 && (
                      <div className="p-2 rounded bg-amber-950/20 border border-amber-900/30 space-y-1">
                        <div className="flex items-center gap-1 text-[10px] font-semibold text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Missing in Resume — Strictly Omitted</span>
                        </div>
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {tailorResult.resumeAnalysis.missingTechnologies.map((m, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 text-[10px] font-mono bg-amber-950/40 text-amber-300 border border-amber-800/40 rounded line-through opacity-80"
                              title="Mentioned in JD but not in your resume. Omitted to prevent hallucination."
                            >
                              {m}
                            </span>
                          ))}
                        </div>
                        <p className="text-[9px] text-amber-400/80 leading-tight pt-1">
                          These were requested in the JD but are absent from your master resume. They were not added.
                        </p>
                      </div>
                    )}

                    {/* Emphasized Experience & Projects */}
                    {(tailorResult.resumeAnalysis.relevantExperience?.length > 0 ||
                      tailorResult.resumeAnalysis.relevantProjects?.length > 0) && (
                      <div className="pt-1 border-t border-neutral-800/60 space-y-1.5">
                        <div className="text-[10px] uppercase font-semibold text-neutral-400 tracking-wider">
                          Emphasized Sections
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {tailorResult.resumeAnalysis.relevantExperience?.map((exp, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 text-[10px] bg-sky-950/50 text-sky-300 border border-sky-800/40 rounded flex items-center gap-1"
                            >
                              <Layers className="w-2.5 h-2.5" />
                              {exp}
                            </span>
                          ))}
                          {tailorResult.resumeAnalysis.relevantProjects?.map((proj, i) => (
                            <span
                              key={i}
                              className="px-1.5 py-0.5 text-[10px] bg-purple-950/50 text-purple-300 border border-purple-800/40 rounded flex items-center gap-1"
                            >
                              <FileCode className="w-2.5 h-2.5" />
                              {proj}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Traceable Changes Summary Accordion */}
            <div className="border border-neutral-800 rounded-lg bg-neutral-950/50 overflow-hidden">
              <button
                id="applyai-toggle-changes-btn"
                onClick={() => setShowChanges(!showChanges)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs text-neutral-300 font-medium hover:bg-neutral-800/40 transition-colors"
              >
                <span>Traceable Change Log ({tailorResult.changes.length})</span>
                {showChanges ? (
                  <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                )}
              </button>

              {showChanges && (
                <div className="p-3 pt-1 border-t border-neutral-800/80 space-y-2 text-xs">
                  {tailorResult.changes.map((item, idx) => (
                    <div key={idx} className="p-2 rounded bg-neutral-900/80 border border-neutral-800 space-y-1">
                      <div className="flex items-center justify-between gap-1.5">
                        <span className="font-semibold text-neutral-200 text-[11px] truncate">
                          {item.section}
                        </span>
                        <span
                          className={`text-[9px] uppercase font-mono px-1.5 py-0.5 rounded border ${getTypeBadgeStyle(
                            item.type || 'rewrite'
                          )}`}
                        >
                          {item.type || 'rewrite'}
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-300 leading-snug">
                        {item.description || item.change}
                      </p>
                      {item.reason && (
                        <p className="text-[10px] text-neutral-400 italic">
                          {item.reason}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* LaTeX Code Preview Toggle */}
            <div className="border border-neutral-800 rounded-lg bg-neutral-950/50 overflow-hidden">
              <div className="px-3 py-2 flex items-center justify-between text-xs text-neutral-300 border-b border-neutral-800/80">
                <button
                  id="applyai-toggle-latex-btn"
                  onClick={() => setShowLatexCode(!showLatexCode)}
                  className="flex items-center gap-1.5 font-medium hover:text-neutral-100 transition-colors"
                >
                  <FileCode className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{showLatexCode ? 'Hide Tailored .tex Code' : 'View Tailored .tex Code'}</span>
                </button>
                <button
                  id="applyai-copy-tex-btn"
                  onClick={handleCopyTex}
                  className="flex items-center gap-1 text-[11px] text-neutral-400 hover:text-neutral-200 transition-colors"
                >
                  {copiedTex ? (
                    <>
                      <CheckCheck className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              {showLatexCode && (
                <pre className="p-3 text-[10px] font-mono text-neutral-300 max-h-48 overflow-y-auto whitespace-pre-wrap select-text bg-neutral-950">
                  {tailorResult.updatedLatex}
                </pre>
              )}
            </div>

            {/* PDF Error notice if compilation fails */}
            {pdfError && (
              <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-900/40 text-amber-300 text-[11px] space-y-1">
                <p className="font-medium">{pdfError}</p>
                <p className="text-amber-400/80">
                  Tip: You can download the <code>.tex</code> file below and compile it directly on Overleaf or your local TeX distribution.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-2 pt-1">
              <button
                id="applyai-download-tex-btn"
                onClick={handleDownloadTex}
                className="w-full py-2 px-3 rounded-lg font-medium text-xs bg-neutral-100 text-neutral-950 hover:bg-white active:scale-[0.99] flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Download Tailored .tex</span>
              </button>

              <button
                id="applyai-download-pdf-btn"
                disabled={isCompilingPdf}
                onClick={handleDownloadPdf}
                className="w-full py-2 px-3 rounded-lg font-medium text-xs bg-neutral-800 hover:bg-neutral-750 text-neutral-200 border border-neutral-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isCompilingPdf ? 'Compiling PDF...' : 'Download PDF'}</span>
              </button>
            </div>

            {/* Section 4: Tailored Outreach Email */}
            <div className="pt-2 border-t border-neutral-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-neutral-200 text-xs">
                  <Mail className="w-3.5 h-3.5 text-amber-400" />
                  <span>Tailored Outreach Email</span>
                </div>
                {emailResult && (
                  <span className="text-[10px] text-amber-400 font-mono">
                    Grounded
                  </span>
                )}
              </div>

              {isGeneratingEmail ? (
                <div className="p-3 bg-neutral-950/60 rounded border border-neutral-800">
                  <LoadingState
                    steps={[
                      'Crafting personalized outreach email...',
                      'Aligning directly with job requirements...',
                      'Ensuring zero AI fluff and factual alignment...',
                    ]}
                    stepIntervalMs={1400}
                  />
                </div>
              ) : emailError ? (
                <div className="p-2.5 rounded bg-red-950/40 border border-red-900/40 text-red-300 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    <span>Email Generation Error</span>
                  </div>
                  <p className="text-[11px] text-red-400/90">{emailError}</p>
                  {onGenerateEmail && (
                    <button
                      id="applyai-resume-retry-email-btn"
                      onClick={onGenerateEmail}
                      className="mt-1 text-[11px] underline text-red-300 hover:text-white"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              ) : emailResult ? (
                <div className="p-3 bg-neutral-950/70 border border-neutral-800 rounded-lg space-y-2.5">
                  {/* Subject Line */}
                  <div className="p-2 bg-neutral-900 rounded border border-neutral-800 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      <span>Subject</span>
                      <button
                        id="applyai-resume-copy-subject-icon-btn"
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
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <p className="text-xs text-neutral-200 font-medium select-all">
                      {emailResult.subject}
                    </p>
                  </div>

                  {/* Body */}
                  <div className="p-2.5 bg-neutral-900 rounded border border-neutral-800 space-y-1.5">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                      <span>Email Body</span>
                      <button
                        id="applyai-resume-copy-body-icon-btn"
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
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="text-xs text-neutral-300 leading-relaxed whitespace-pre-line select-text max-h-48 overflow-y-auto bg-neutral-950/60 p-2 rounded border border-neutral-800/60 font-sans">
                      {emailResult.body}
                    </div>
                  </div>

                  {/* Three Action Buttons: [Copy Subject], [Copy Email], [Save] */}
                  <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                    <button
                      id="applyai-resume-email-copy-subject-btn"
                      onClick={handleCopySubject}
                      className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-[11px] font-medium rounded border border-neutral-700 flex items-center justify-center gap-1 transition-colors"
                    >
                      {copiedSubject ? (
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-neutral-400" />
                      )}
                      <span>Copy Subject</span>
                    </button>

                    <button
                      id="applyai-resume-email-copy-body-btn"
                      onClick={handleCopyEmailBody}
                      className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-[11px] font-medium rounded border border-neutral-700 flex items-center justify-center gap-1 transition-colors"
                    >
                      {copiedEmailBody ? (
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3 text-neutral-400" />
                      )}
                      <span>Copy Email</span>
                    </button>

                    <button
                      id="applyai-resume-email-save-btn"
                      onClick={handleSaveEmail}
                      className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-200 text-[11px] font-medium rounded border border-neutral-700 flex items-center justify-center gap-1 transition-colors"
                      title="Save outreach email to text file"
                    >
                      <Download className="w-3 h-3 text-neutral-400" />
                      <span>Save</span>
                    </button>
                  </div>
                </div>
              ) : onGenerateEmail ? (
                <div className="p-3 bg-neutral-950/50 rounded border border-neutral-800/80 text-center space-y-1.5">
                  <p className="text-xs text-neutral-400">
                    Generate an outreach email tailored to this job posting.
                  </p>
                  <button
                    id="applyai-resume-generate-email-btn"
                    onClick={onGenerateEmail}
                    className="py-1 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded transition-colors"
                  >
                    Generate Outreach Email
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
