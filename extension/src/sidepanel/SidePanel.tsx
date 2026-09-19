import React, { useState, useEffect } from 'react';
import { JobDescription, TailoredResumeResult, RecruiterSearchResponse, ExtensionActiveTab } from '../types';
import { ApplyPanel } from '../components/ApplyPanel';
import { ResumePanel } from '../components/ResumePanel';
import { RecruiterPanel } from '../components/RecruiterPanel';
import { SettingsPanel } from '../components/SettingsPanel';
import { analyzeJdApi, tailorResumeApi, findRecruiterApi } from '../api/client';
import { getStoredData } from '../storage/storage';

export const SidePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ExtensionActiveTab>('apply');
  const [job, setJob] = useState<JobDescription | null>(null);
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

  // When sidepanel opens, try to extract from current active tab
  useEffect(() => {
    extractFromCurrentTab();
  }, []);

  const extractFromCurrentTab = async () => {
    setIsDetecting(true);
    setDetectError(null);

    try {
      if (typeof chrome !== 'undefined' && chrome?.tabs?.query) {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const activeTab = tabs[0];
          if (!activeTab || !activeTab.id) {
            setIsDetecting(false);
            return;
          }

          chrome.tabs.sendMessage(
            activeTab.id,
            { type: 'APPLYAI_EXTRACT_PAGE' },
            async (response) => {
              if (chrome.runtime.lastError || !response?.pageText) {
                // If content script not injected yet, execute script
                try {
                  const results = await chrome.scripting.executeScript({
                    target: { tabId: activeTab.id! },
                    func: () => ({
                      pageText: document.body ? document.body.innerText : '',
                      title: document.title || '',
                      url: window.location.href || '',
                    }),
                  });

                  if (results?.[0]?.result?.pageText) {
                    const analyzed = await analyzeJdApi(results[0].result);
                    setJob(analyzed);
                  }
                } catch (e) {
                  setDetectError('Could not read page text from active tab.');
                }
              } else {
                try {
                  const analyzed = await analyzeJdApi(response);
                  setJob(analyzed);
                } catch (apiErr) {
                  setDetectError(apiErr instanceof Error ? apiErr.message : 'Analysis failed');
                }
              }
              setIsDetecting(false);
            }
          );
        });
      } else {
        // Fallback in web dev
        setIsDetecting(false);
      }
    } catch (err) {
      setIsDetecting(false);
      setDetectError(err instanceof Error ? err.message : 'Page extraction error');
    }
  };

  const handleTailorResume = async () => {
    if (!job) return;
    setActiveTab('resume');
    setIsTailoring(true);
    setTailorError(null);
    try {
      const stored = await getStoredData();
      const result = await tailorResumeApi({
        job,
        resumeFacts: stored.resume.facts,
        latexTemplate: stored.resume.latexTemplate,
      });
      setTailorResult(result);
    } catch (err) {
      setTailorError(err instanceof Error ? err.message : 'Resume tailoring failed.');
    } finally {
      setIsTailoring(false);
    }
  };

  const handleFindRecruiter = async () => {
    if (!job) return;
    setActiveTab('recruiter');
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
      setRecruiterError(err instanceof Error ? err.message : 'Recruiter search failed.');
    } finally {
      setIsSearchingRecruiters(false);
    }
  };

  return (
    <div className="w-full h-screen bg-neutral-900 text-neutral-100 flex flex-col font-sans select-none">
      {activeTab === 'apply' && (
        <ApplyPanel
          job={job}
          isDetecting={isDetecting}
          detectError={detectError}
          onDetectJd={extractFromCurrentTab}
          onTailorResume={handleTailorResume}
          onFindRecruiter={handleFindRecruiter}
          onOpenSettings={() => setActiveTab('settings')}
        />
      )}

      {activeTab === 'resume' && job && (
        <ResumePanel
          job={job}
          tailorResult={tailorResult}
          isLoading={isTailoring}
          error={tailorError}
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
        <SettingsPanel onBack={() => setActiveTab('apply')} />
      )}
    </div>
  );
};
