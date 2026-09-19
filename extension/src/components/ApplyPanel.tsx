import React from 'react';
import { Check, Settings, Sparkles, Building2, MapPin, Briefcase, RefreshCw, AlertCircle } from 'lucide-react';
import { JobDescription } from '../types';

interface ApplyPanelProps {
  job: JobDescription | null;
  isDetecting: boolean;
  detectError: string | null;
  onDetectJd: () => void;
  onTailorResume: () => void;
  onFindRecruiter: () => void;
  onOpenSettings: () => void;
  onClose?: () => void;
}

export const ApplyPanel: React.FC<ApplyPanelProps> = ({
  job,
  isDetecting,
  detectError,
  onDetectJd,
  onTailorResume,
  onFindRecruiter,
  onOpenSettings,
  onClose,
}) => {
  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-100 text-sm select-none">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-neutral-800">
        <div className="flex items-center gap-1.5 font-semibold text-neutral-100 text-xs tracking-wide">
          <Sparkles className="w-3.5 h-3.5 text-neutral-300" />
          <span>ApplyAI</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            id="applyai-header-settings-btn"
            onClick={onOpenSettings}
            title="Settings"
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
          {onClose && (
            <button
              id="applyai-header-close-btn"
              onClick={onClose}
              title="Close panel"
              className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors text-xs font-mono"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="p-3.5 space-y-3.5 flex-1 overflow-y-auto">
        {/* Detection Status Card */}
        <div className="bg-neutral-950/70 border border-neutral-800 rounded-lg p-3 space-y-2">
          {isDetecting ? (
            <div className="flex items-center gap-2 py-2 text-neutral-400 text-xs">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-neutral-400" />
              <span>Scanning page for job posting...</span>
            </div>
          ) : job ? (
            <>
              <div>
                <h3 className="font-semibold text-neutral-100 text-sm leading-snug line-clamp-2">
                  {job.title}
                </h3>
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-xs text-neutral-400">
                  {job.company && (
                    <span className="flex items-center gap-1 text-neutral-300">
                      <Building2 className="w-3 h-3 text-neutral-500" />
                      {job.company}
                    </span>
                  )}
                  {job.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-neutral-500" />
                      {job.location}
                    </span>
                  )}
                  {job.employmentType && (
                    <span className="flex items-center gap-1">
                      <Briefcase className="w-3 h-3 text-neutral-500" />
                      {job.employmentType}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-neutral-800/80 text-[11px]">
                <span className="flex items-center gap-1 text-emerald-400 font-medium">
                  <Check className="w-3 h-3 stroke-[2.5]" />
                  <span>JD detected</span>
                </span>
                <button
                  id="applyai-redetect-btn"
                  onClick={onDetectJd}
                  className="text-neutral-400 hover:text-neutral-200 transition-colors underline underline-offset-2"
                >
                  Rescan
                </button>
              </div>

              {job.skills.length > 0 && (
                <div className="flex flex-wrap gap-1 pt-1">
                  {job.skills.slice(0, 5).map((skill, idx) => (
                    <span
                      key={idx}
                      className="px-1.5 py-0.5 rounded bg-neutral-800/80 text-neutral-300 text-[10px] font-mono"
                    >
                      {skill}
                    </span>
                  ))}
                  {job.skills.length > 5 && (
                    <span className="px-1.5 py-0.5 rounded bg-neutral-800/40 text-neutral-400 text-[10px] font-mono">
                      +{job.skills.length - 5} more
                    </span>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="space-y-2 py-1">
              <p className="text-xs text-neutral-400">
                No job posting detected on this page yet.
              </p>
              {detectError && (
                <div className="flex items-start gap-1.5 text-[11px] text-amber-400/90 bg-amber-950/30 p-2 rounded border border-amber-900/40">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{detectError}</span>
                </div>
              )}
              <button
                id="applyai-scan-btn"
                onClick={onDetectJd}
                className="w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-medium rounded transition-colors"
              >
                Scan Current Page
              </button>
            </div>
          )}
        </div>

        {/* Primary Action Buttons */}
        <div className="space-y-2">
          <button
            id="applyai-tailor-resume-btn"
            disabled={!job || isDetecting}
            onClick={onTailorResume}
            className={`w-full py-2.5 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all ${
              job && !isDetecting
                ? 'bg-neutral-100 text-neutral-950 hover:bg-white active:scale-[0.99] shadow-sm'
                : 'bg-neutral-800/60 text-neutral-500 cursor-not-allowed border border-neutral-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Tailor Resume</span>
          </button>

          <button
            id="applyai-find-recruiter-btn"
            disabled={!job || isDetecting}
            onClick={onFindRecruiter}
            className={`w-full py-2.5 px-3 rounded-lg font-medium text-xs flex items-center justify-center gap-2 transition-all ${
              job && !isDetecting
                ? 'bg-neutral-800 hover:bg-neutral-750 text-neutral-200 hover:text-neutral-100 border border-neutral-700 active:scale-[0.99]'
                : 'bg-neutral-850 text-neutral-600 cursor-not-allowed border border-neutral-800/60'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Find Recruiter</span>
          </button>
        </div>
      </div>

      {/* Footer Settings link */}
      <div className="px-3.5 py-2 border-t border-neutral-800/80 flex items-center justify-between text-[11px] text-neutral-400">
        <span>ApplyAI Local Tool</span>
        <button
          id="applyai-footer-settings-btn"
          onClick={onOpenSettings}
          className="text-neutral-400 hover:text-neutral-200 transition-colors"
        >
          Settings
        </button>
      </div>
    </div>
  );
};
