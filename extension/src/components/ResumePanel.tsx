import React, { useState } from 'react';
import { ArrowLeft, Check, Download, FileCode, FileText, AlertCircle, Copy, CheckCheck, ChevronDown, ChevronUp } from 'lucide-react';
import { TailoredResumeResult, JobDescription } from '../types';
import { LoadingState } from './LoadingState';
import { compilePdfApi } from '../api/client';

interface ResumePanelProps {
  job: JobDescription;
  tailorResult: TailoredResumeResult | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onRetry: () => void;
}

export const ResumePanel: React.FC<ResumePanelProps> = ({
  job,
  tailorResult,
  isLoading,
  error,
  onBack,
  onRetry,
}) => {
  const [showChanges, setShowChanges] = useState(true);
  const [showLatexCode, setShowLatexCode] = useState(false);
  const [isCompilingPdf, setIsCompilingPdf] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [copiedTex, setCopiedTex] = useState(false);

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

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-100 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            id="applyai-resume-back-btn"
            onClick={onBack}
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
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
                'Analyzing job description...',
                'Finding relevant experience...',
                'Aligning keywords and technologies...',
                'Formatting valid LaTeX template...',
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
            {/* Success Banner */}
            <div className="flex items-center justify-between px-3 py-2 bg-emerald-950/30 border border-emerald-900/40 rounded-lg text-emerald-300 text-xs">
              <span className="flex items-center gap-1.5 font-medium">
                <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>Resume Tailored</span>
              </span>
              <span className="text-[11px] font-mono text-emerald-400/80">
                {tailorResult.changes.length} adjustments
              </span>
            </div>

            {/* Changes Summary Accordion */}
            <div className="border border-neutral-800 rounded-lg bg-neutral-950/50 overflow-hidden">
              <button
                id="applyai-toggle-changes-btn"
                onClick={() => setShowChanges(!showChanges)}
                className="w-full px-3 py-2 flex items-center justify-between text-xs text-neutral-300 font-medium hover:bg-neutral-800/40 transition-colors"
              >
                <span>Change Log</span>
                {showChanges ? (
                  <ChevronUp className="w-3.5 h-3.5 text-neutral-500" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-neutral-500" />
                )}
              </button>

              {showChanges && (
                <div className="p-3 pt-1 border-t border-neutral-800/80 space-y-2 text-xs">
                  {tailorResult.changes.map((item, idx) => (
                    <div key={idx} className="space-y-0.5 text-[11px]">
                      <div className="flex items-baseline gap-1.5 font-mono text-neutral-400">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span className="font-semibold text-neutral-200">{item.section}:</span>
                        <span className="text-neutral-300">{item.change}</span>
                      </div>
                      <p className="text-[10px] text-neutral-400 pl-3 italic">
                        {item.reason}
                      </p>
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
                  <span>{showLatexCode ? 'Hide .tex Code' : 'View .tex Code'}</span>
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
                  Tip: You can download the <code>.tex</code> file below and paste or compile it directly on Overleaf!
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
                <span>Download .tex</span>
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
          </div>
        ) : null}
      </div>
    </div>
  );
};
