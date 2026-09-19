import React, { useState } from 'react';
import { ArrowLeft, Building2, Mail, ExternalLink, Copy, CheckCheck, AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';
import { JobDescription, RecruiterSearchResponse } from '../types';
import { LoadingState } from './LoadingState';

interface RecruiterPanelProps {
  job: JobDescription;
  result: RecruiterSearchResponse | null;
  isLoading: boolean;
  error: string | null;
  onBack: () => void;
  onRetry: () => void;
}

export const RecruiterPanel: React.FC<RecruiterPanelProps> = ({
  job,
  result,
  isLoading,
  error,
  onBack,
  onRetry,
}) => {
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  const handleCopyEmail = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    } catch (e) {
      console.error('Failed to copy email:', e);
    }
  };

  const getConfidenceBadge = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high':
        return (
          <span className="px-1.5 py-0.5 rounded bg-emerald-950/70 border border-emerald-800/60 text-emerald-400 text-[10px] font-medium flex items-center gap-1">
            <ShieldCheck className="w-2.5 h-2.5" /> High Confidence
          </span>
        );
      case 'medium':
        return (
          <span className="px-1.5 py-0.5 rounded bg-amber-950/60 border border-amber-800/50 text-amber-300 text-[10px] font-medium">
            Medium Confidence
          </span>
        );
      case 'low':
        return (
          <span className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-400 text-[10px]">
            General / Affiliated
          </span>
        );
    }
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-100 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            id="applyai-recruiter-back-btn"
            onClick={onBack}
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-semibold text-neutral-200 text-xs">Find Recruiter</span>
        </div>
        <span className="text-[10px] font-mono text-neutral-400 truncate max-w-[140px]">
          {job.company || 'Company'}
        </span>
      </div>

      {/* Content */}
      <div className="p-3.5 space-y-3 flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="py-8">
            <LoadingState
              steps={[
                'Searching public sources...',
                'Identifying relevant recruiters and hiring managers...',
                'Checking public contact information and evidence...',
              ]}
              stepIntervalMs={1800}
            />
          </div>
        ) : error ? (
          <div className="space-y-3 py-4">
            <div className="p-3 rounded-lg bg-red-950/40 border border-red-900/40 text-red-300 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
              <div>
                <p className="font-medium">Search Failed</p>
                <p className="mt-1 text-[11px] text-red-400/90">{error}</p>
              </div>
            </div>
            <button
              id="applyai-recruiter-retry-btn"
              onClick={onRetry}
              className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : result ? (
          <div className="space-y-3">
            {result.recruiters.length === 0 ? (
              /* No recruiter found state */
              <div className="bg-neutral-950/70 border border-neutral-800 rounded-lg p-3.5 space-y-2.5 text-xs text-neutral-300">
                <p className="font-medium text-neutral-200">
                  No clearly identifiable recruiter found.
                </p>
                {result.generalContactEmail ? (
                  <div className="pt-2 border-t border-neutral-800 space-y-1">
                    <p className="text-[11px] text-neutral-400">Possible recruiting contact:</p>
                    <div className="flex items-center justify-between bg-neutral-900 px-2.5 py-1.5 rounded border border-neutral-800">
                      <span className="font-mono text-neutral-200 text-[11px]">
                        {result.generalContactEmail}
                      </span>
                      <button
                        id="applyai-copy-general-email-btn"
                        onClick={() => handleCopyEmail(result.generalContactEmail!)}
                        className="text-neutral-400 hover:text-neutral-200 text-[11px] flex items-center gap-1"
                      >
                        {copiedEmail === result.generalContactEmail ? (
                          <CheckCheck className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                      </button>
                    </div>
                  </div>
                ) : (
                  <p className="text-[11px] text-neutral-400">
                    No public email or direct sourcers were listed publicly for {job.company || 'this company'}.
                  </p>
                )}
                {result.notes && (
                  <p className="text-[10px] text-neutral-400 italic pt-1">{result.notes}</p>
                )}
              </div>
            ) : (
              /* Recruiter cards found */
              result.recruiters.map((recruiter, idx) => (
                <div
                  key={idx}
                  className="bg-neutral-950/70 border border-neutral-800 rounded-lg p-3 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-semibold text-neutral-100 text-xs flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-neutral-300" />
                        <span>{recruiter.name}</span>
                      </h4>
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
                    {getConfidenceBadge(recruiter.confidence)}
                  </div>

                  {/* Email section (with strict zero-fabrication honest indicator) */}
                  <div className="p-2 bg-neutral-900/90 rounded border border-neutral-800 text-[11px]">
                    {recruiter.email ? (
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-emerald-300 select-all truncate max-w-[190px]">
                          {recruiter.email}
                        </span>
                        <button
                          id={`applyai-copy-recruiter-email-${idx}`}
                          onClick={() => handleCopyEmail(recruiter.email!)}
                          className="flex items-center gap-1 text-[10px] font-medium text-neutral-300 hover:text-white px-1.5 py-0.5 rounded bg-neutral-800 hover:bg-neutral-700 transition-colors"
                        >
                          {copiedEmail === recruiter.email ? (
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

                  {/* Evidence explanation */}
                  {recruiter.evidence && (
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      {recruiter.evidence}
                    </p>
                  )}

                  {/* Link buttons */}
                  <div className="flex items-center gap-2 pt-1 border-t border-neutral-800/80 text-[11px]">
                    {recruiter.linkedin && (
                      <a
                        id={`applyai-open-linkedin-${idx}`}
                        href={recruiter.linkedin}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-300 hover:text-neutral-100 flex items-center gap-1 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3 text-neutral-400" />
                        <span>Open LinkedIn</span>
                      </a>
                    )}
                    {recruiter.sourceUrls.length > 0 && (
                      <a
                        id={`applyai-view-source-${idx}`}
                        href={recruiter.sourceUrls[0]}
                        target="_blank"
                        rel="noreferrer"
                        className="text-neutral-400 hover:text-neutral-200 flex items-center gap-1 ml-auto transition-colors"
                      >
                        <span>View Source</span>
                        <ExternalLink className="w-2.5 h-2.5 text-neutral-500" />
                      </a>
                    )}
                  </div>
                </div>
              ))
            )}

            {/* General contact fallback if recruiters were found too */}
            {result.recruiters.length > 0 && result.generalContactEmail && (
              <div className="p-2.5 bg-neutral-950/40 border border-neutral-800/80 rounded-lg flex items-center justify-between text-[11px] text-neutral-400">
                <span>General careers contact:</span>
                <span className="font-mono text-neutral-300">{result.generalContactEmail}</span>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};
