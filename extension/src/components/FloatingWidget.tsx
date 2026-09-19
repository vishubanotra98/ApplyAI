import React, { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import {
  JobDescription,
  TailoredResumeResult,
  RecruiterSearchResponse,
  TailoredEmailResult,
  ExtensionActiveTab,
} from '../types';
import { ApplyPanel } from './ApplyPanel';
import { ResumePanel } from './ResumePanel';
import { RecruiterPanel } from './RecruiterPanel';
import { SettingsPanel } from './SettingsPanel';
import { ApplicationResultsView } from './ApplicationResultsView';
import {
  analyzeJdApi,
  tailorResumeApi,
  findRecruiterApi,
  generateOutreachEmailApi,
} from '../api/client';
import { getStoredData } from '../storage/storage';

interface FloatingWidgetProps {
  initialJob?: JobDescription | null;
  pageTextProvider?: () => { pageText: string; title: string; url: string };
  defaultOpen?: boolean;
}

export const FloatingWidget: React.FC<FloatingWidgetProps> = ({
  initialJob = null,
  pageTextProvider,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [activeTab, setActiveTab] = useState<ExtensionActiveTab>('apply');
  const [job, setJob] = useState<JobDescription | null>(initialJob);
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectError, setDetectError] = useState<string | null>(null);

  // Resume Tailoring State
  const [tailorResult, setTailorResult] = useState<TailoredResumeResult | null>(null);
  const [isTailoring, setIsTailoring] = useState(false);
  const [tailorError, setTailorError] = useState<string | null>(null);

  // Recruiter Search State
  const [recruiterResult, setRecruiterResult] = useState<RecruiterSearchResponse | null>(null);
  const [isSearchingRecruiters, setIsSearchingRecruiters] = useState(false);
  const [recruiterError, setRecruiterError] = useState<string | null>(null);

  // Outreach Email State
  const [emailResult, setEmailResult] = useState<TailoredEmailResult | null>(null);
  const [isGeneratingEmail, setIsGeneratingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  // Automatic initial scan if pageTextProvider is provided and no initial job
  useEffect(() => {
    if (!job && pageTextProvider && isOpen) {
      handleDetectJob();
    }
  }, [isOpen]);

  const handleDetectJob = async () => {
    setIsDetecting(true);
    setDetectError(null);
    try {
      let pageData: { pageText: string; title: string; url: string };
      if (pageTextProvider) {
        pageData = pageTextProvider();
      } else if (typeof document !== 'undefined') {
        pageData = {
          pageText: document.body ? document.body.innerText : '',
          title: document.title || '',
          url: window.location.href || '',
        };
      } else {
        throw new Error('No page content available to extract.');
      }

      const analyzed = await analyzeJdApi(pageData);
      setJob(analyzed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to extract job description.';
      setDetectError(msg);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleTailorResume = async () => {
    if (!job) return;
    setActiveTab('results');
    setIsTailoring(true);
    setTailorError(null);
    try {
      const stored = await getStoredData();
      const result = await tailorResumeApi({
        job,
        resumeFacts: stored.resume.facts,
        latexTemplate: stored.masterResume?.latexTemplate || stored.resume.latexTemplate,
        stack: stored.stack,
      });
      setTailorResult(result);

      // Auto-trigger outreach email generation if not present
      if (!emailResult && !isGeneratingEmail) {
        handleGenerateEmail(result);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Resume tailoring failed.';
      setTailorError(msg);
    } finally {
      setIsTailoring(false);
    }
  };

  const handleFindRecruiter = async () => {
    if (!job) return;
    setActiveTab('results');
    setIsSearchingRecruiters(true);
    setRecruiterError(null);
    try {
      const result = await findRecruiterApi({
        company: job.company || 'Unknown Company',
        jobTitle: job.title,
        location: job.location,
        jd: `${job.title} at ${job.company || ''}. Skills: ${job.skills.join(', ')}`,
      });
      setRecruiterResult(result);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Recruiter search failed.';
      setRecruiterError(msg);
    } finally {
      setIsSearchingRecruiters(false);
    }
  };

  const handleGenerateEmail = async (overrideTailor?: TailoredResumeResult) => {
    if (!job) return;
    setIsGeneratingEmail(true);
    setEmailError(null);
    try {
      const stored = await getStoredData();
      const result = await generateOutreachEmailApi({
        job,
        resumeFacts: stored.resume.facts,
        stack: stored.stack,
        profile: stored.profile,
        recruiter: recruiterResult?.recruiters?.[0] ? {
          name: recruiterResult.recruiters[0].name,
          title: recruiterResult.recruiters[0].title,
          company: recruiterResult.recruiters[0].company || job.company,
        } : {
          company: job.company,
        },
      });
      setEmailResult(result);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : 'Failed to generate outreach email.');
    } finally {
      setIsGeneratingEmail(false);
    }
  };

  const handleRunAll = async () => {
    if (!job) return;
    setActiveTab('results');
    await Promise.allSettled([
      handleTailorResume(),
      handleFindRecruiter(),
    ]);
    await handleGenerateEmail();
  };

  return (
    <div className="applyai-widget-root fixed bottom-5 right-5 z-[999999] font-sans antialiased">
      {/* Floating Sparkle Trigger Button */}
      {!isOpen && (
        <button
          id="applyai-floating-btn"
          onClick={() => setIsOpen(true)}
          title="ApplyAI — Job Assistant"
          className="w-10 h-10 rounded-full bg-neutral-900 border border-neutral-700/80 hover:border-neutral-500 shadow-xl flex items-center justify-center text-neutral-200 hover:text-white transition-all transform hover:scale-105 active:scale-95 group"
        >
          <Sparkles className="w-4 h-4 transition-transform group-hover:rotate-12 text-neutral-300" />
        </button>
      )}

      {/* Floating Card Panel */}
      {isOpen && (
        <div
          id="applyai-floating-panel"
          className="w-[360px] h-[520px] max-h-[85vh] bg-neutral-900 border border-neutral-800 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150"
        >
          {activeTab === 'apply' && (
            <ApplyPanel
              job={job}
              isDetecting={isDetecting}
              detectError={detectError}
              onDetectJd={handleDetectJob}
              onTailorResume={handleTailorResume}
              onFindRecruiter={handleFindRecruiter}
              onOpenSettings={() => setActiveTab('settings')}
              onClose={() => setIsOpen(false)}
            />
          )}

          {activeTab === 'results' && job && (
            <ApplicationResultsView
              job={job}
              tailorResult={tailorResult}
              isTailoring={isTailoring}
              tailorError={tailorError}
              onTailorResume={handleTailorResume}
              recruiterResult={recruiterResult}
              isSearchingRecruiter={isSearchingRecruiters}
              recruiterError={recruiterError}
              onFindRecruiter={handleFindRecruiter}
              emailResult={emailResult}
              isGeneratingEmail={isGeneratingEmail}
              emailError={emailError}
              onGenerateEmail={() => handleGenerateEmail()}
              onRunAll={handleRunAll}
              onBack={() => setActiveTab('apply')}
              onOpenSettings={() => setActiveTab('settings')}
            />
          )}

          {activeTab === 'resume' && job && (
            <ResumePanel
              job={job}
              tailorResult={tailorResult}
              isLoading={isTailoring}
              error={tailorError}
              emailResult={emailResult}
              isGeneratingEmail={isGeneratingEmail}
              emailError={emailError}
              onGenerateEmail={() => handleGenerateEmail()}
              onBack={() => setActiveTab('apply')}
              onRetry={handleTailorResume}
            />
          )}

          {activeTab === 'recruiter' && job && (
            <RecruiterPanel
              job={job}
              result={recruiterResult}
              isLoading={isSearchingRecruiters}
              error={recruiterError}
              onBack={() => setActiveTab('apply')}
              onRetry={handleFindRecruiter}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsPanel onBack={() => setActiveTab(job ? 'results' : 'apply')} />
          )}
        </div>
      )}
    </div>
  );
};
