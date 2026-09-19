import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Save,
  RotateCcw,
  Check,
  Plus,
  Trash2,
  Code2,
  User,
  Briefcase,
  Server,
  CheckCircle2,
  Sparkles,
  Layers,
  Upload,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { StoredData, ExperienceFact, ProjectFact, TechStack } from '../types';
import { getStoredData, saveStoredData, resetToDefaults } from '../storage/storage';
import { parseMasterResumeApi, checkBackendHealth } from '../api/client';
import { DEFAULT_BACKEND_URL, sanitizeBackendUrl } from '../config';

interface SettingsPanelProps {
  onBack: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onBack }) => {
  const [data, setData] = useState<StoredData | null>(null);
  const [activeTab, setActiveTab] = useState<'master' | 'stack' | 'facts' | 'profile' | 'backend'>('master');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parseMessage, setParseMessage] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  // Backend Health Test State
  const [isTestingBackend, setIsTestingBackend] = useState(false);
  const [backendTestStatus, setBackendTestStatus] = useState<{
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  useEffect(() => {
    getStoredData().then((loaded) => setData(loaded));
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full p-4 text-xs text-neutral-400">
        Loading settings...
      </div>
    );
  }

  const handleTestBackend = async () => {
    setIsTestingBackend(true);
    setBackendTestStatus(null);
    try {
      // First save the current input URL so the client uses the updated URL
      const cleanUrl = sanitizeBackendUrl(data.settings.backendUrl);
      const updated = await saveStoredData({
        ...data,
        settings: {
          ...data.settings,
          backendUrl: cleanUrl,
        },
      });
      setData(updated);

      const health = await checkBackendHealth();
      setBackendTestStatus({
        success: true,
        message: `Connected successfully (${health.service || 'Backend OK'})`,
        details: `Model: ${health.model} | API Key: ${health.hasApiKey ? 'Configured' : 'Missing'}`,
      });
    } catch (err) {
      setBackendTestStatus({
        success: false,
        message: err instanceof Error ? err.message : 'Connection failed',
      });
    } finally {
      setIsTestingBackend(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      const cleanUrl = sanitizeBackendUrl(data.settings.backendUrl);
      const updated = await saveStoredData({
        ...data,
        settings: {
          ...data.settings,
          backendUrl: cleanUrl,
        },
      });
      setData(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all profile, tech stack, resume facts, and master LaTeX to defaults?')) {
      const reset = await resetToDefaults();
      setData(reset);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  const calculateHash = (str: string): string => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return hash.toString(36);
  };

  const handleParseMasterResume = async (force: boolean = false) => {
    const template = data.masterResume?.latexTemplate || data.resume?.latexTemplate;
    if (!template || template.trim().length < 10) {
      setParseError('Please provide a valid LaTeX template to parse.');
      return;
    }

    const currentHash = calculateHash(template.trim());

    // Check if the master resume has already been parsed with this exact content
    if (!force && data.masterResume?.parsedHash === currentHash && data.masterResume?.profile) {
      const cached = data.masterResume.profile;
      const updatedData: StoredData = {
        ...data,
        profile: {
          ...data.profile,
          ...cached.profile,
        },
        stack: {
          ...data.stack,
          ...cached.stack,
        },
        resume: {
          ...data.resume,
          facts: {
            ...data.resume.facts,
            ...cached.facts,
            stack: cached.stack,
          },
        },
      };
      setData(updatedData);
      setParseMessage('Loaded cached profile for current master resume (already up to date).');
      setTimeout(() => setParseMessage(null), 4000);
      return;
    }

    setIsParsing(true);
    setParseMessage(null);
    setParseError(null);

    try {
      const parsed = await parseMasterResumeApi(template);

      const updatedData: StoredData = {
        ...data,
        profile: {
          ...data.profile,
          ...parsed.profile,
        },
        stack: {
          ...data.stack,
          ...parsed.stack,
        },
        resume: {
          ...data.resume,
          facts: {
            ...data.resume.facts,
            ...parsed.facts,
            stack: parsed.stack,
          },
        },
        masterResume: {
          latexTemplate: template,
          lastParsedAt: new Date().toLocaleDateString(),
          parsedHash: currentHash,
          profile: {
            profile: parsed.profile,
            stack: parsed.stack,
            facts: parsed.facts,
          },
        },
      };

      setData(updatedData);
      await saveStoredData(updatedData);
      setParseMessage('Successfully parsed stack, profile, and ground-truth facts from master resume!');
      setTimeout(() => setParseMessage(null), 4000);
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Failed to parse master resume.');
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setData((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            masterResume: {
              ...prev.masterResume,
              latexTemplate: content,
            },
            resume: {
              ...prev.resume,
              latexTemplate: content,
            },
          };
        });
      }
    };
    reader.readAsText(file);
  };

  // Profile handlers
  const updateProfile = (field: keyof StoredData['profile'], val: string) => {
    setData((prev) => (!prev ? prev : { ...prev, profile: { ...prev.profile, [field]: val } }));
  };

  // Stack handlers
  const updateStackCategory = (category: keyof TechStack, itemsString: string) => {
    const items = itemsString
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        stack: {
          ...prev.stack,
          [category]: items,
        },
      };
    });
  };

  // Facts handlers
  const updateSkills = (csv: string) => {
    const list = csv
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    setData((prev) =>
      !prev
        ? prev
        : {
            ...prev,
            resume: {
              ...prev.resume,
              facts: { ...prev.resume.facts, skills: list },
            },
          }
    );
  };

  const addExperience = () => {
    const newExp: ExperienceFact = {
      company: 'New Company',
      role: 'Software Engineer',
      dates: '2023 -- Present',
      bullets: ['Engineered key feature achieving measurable performance increase.'],
      technologies: ['TypeScript', 'React'],
    };
    setData((prev) =>
      !prev
        ? prev
        : {
            ...prev,
            resume: {
              ...prev.resume,
              facts: {
                ...prev.resume.facts,
                experience: [newExp, ...prev.resume.facts.experience],
              },
            },
          }
    );
  };

  const removeExperience = (index: number) => {
    setData((prev) =>
      !prev
        ? prev
        : {
            ...prev,
            resume: {
              ...prev.resume,
              facts: {
                ...prev.resume.facts,
                experience: prev.resume.facts.experience.filter((_, i) => i !== index),
              },
            },
          }
    );
  };

  const updateExperience = (index: number, patch: Partial<ExperienceFact>) => {
    setData((prev) => {
      if (!prev) return prev;
      const list = [...prev.resume.facts.experience];
      list[index] = { ...list[index], ...patch };
      return {
        ...prev,
        resume: {
          ...prev.resume,
          facts: { ...prev.resume.facts, experience: list },
        },
      };
    });
  };

  const stackCategories: { key: keyof TechStack; label: string; placeholder: string }[] = [
    { key: 'languages', label: 'Languages', placeholder: 'TypeScript, JavaScript, Python, SQL' },
    { key: 'frontend', label: 'Frontend', placeholder: 'React, Next.js, ReactFlow, Vue' },
    { key: 'backend', label: 'Backend', placeholder: 'Node.js, Express, Fastify, Django' },
    { key: 'databases', label: 'Databases', placeholder: 'PostgreSQL, MySQL, Redis, MongoDB' },
    { key: 'stateManagement', label: 'State Management', placeholder: 'Redux Toolkit, Zustand, TanStack Query' },
    { key: 'styling', label: 'Styling', placeholder: 'Tailwind CSS, CSS3, SCSS, Emotion' },
    { key: 'devTools', label: 'Developer Tools', placeholder: 'Git, Docker, Vite, Webpack, Postman' },
    { key: 'cloud', label: 'Cloud & Hosting', placeholder: 'AWS, GCP, Vercel, Supabase' },
    { key: 'queues', label: 'Queues & Streaming', placeholder: 'Kafka, RabbitMQ, BullMQ' },
    { key: 'other', label: 'Other Tech / Libs', placeholder: 'Zod, D3.js, Motion' },
  ];

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-100 text-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-neutral-800">
        <div className="flex items-center gap-2">
          <button
            id="applyai-settings-back-btn"
            onClick={onBack}
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
          </button>
          <span className="font-semibold text-neutral-200 text-xs">Settings & Master Resume</span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            id="applyai-reset-defaults-btn"
            onClick={handleReset}
            title="Reset to default sample"
            className="p-1 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800 rounded transition-colors text-xs"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          <button
            id="applyai-save-settings-btn"
            onClick={handleSave}
            disabled={isSaving}
            className="px-2.5 py-1 bg-neutral-100 hover:bg-white text-neutral-950 font-medium text-xs rounded flex items-center gap-1 transition-all"
          >
            {saveSuccess ? (
              <>
                <Check className="w-3 h-3 text-emerald-600" />
                <span>Saved</span>
              </>
            ) : (
              <>
                <Save className="w-3 h-3" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-neutral-800 text-xs px-2 bg-neutral-950/60 overflow-x-auto">
        <button
          id="applyai-tab-master"
          onClick={() => setActiveTab('master')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'master'
              ? 'border-neutral-200 text-neutral-100'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          }`}
        >
          <Code2 className="w-3 h-3" />
          <span>Master LaTeX</span>
        </button>
        <button
          id="applyai-tab-stack"
          onClick={() => setActiveTab('stack')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'stack'
              ? 'border-neutral-200 text-neutral-100'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          }`}
        >
          <Layers className="w-3 h-3" />
          <span>Tech Stack</span>
        </button>
        <button
          id="applyai-tab-facts"
          onClick={() => setActiveTab('facts')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'facts'
              ? 'border-neutral-200 text-neutral-100'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          }`}
        >
          <Briefcase className="w-3 h-3" />
          <span>Experience</span>
        </button>
        <button
          id="applyai-tab-profile"
          onClick={() => setActiveTab('profile')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'profile'
              ? 'border-neutral-200 text-neutral-100'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          }`}
        >
          <User className="w-3 h-3" />
          <span>Profile</span>
        </button>
        <button
          id="applyai-tab-backend"
          onClick={() => setActiveTab('backend')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'backend'
              ? 'border-neutral-200 text-neutral-100'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          }`}
        >
          <Server className="w-3 h-3" />
          <span>Backend</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="p-3.5 space-y-3.5 flex-1 overflow-y-auto">
        {/* Master LaTeX Tab */}
        {activeTab === 'master' && (
          <div className="space-y-3 text-xs">
            <div className="p-2.5 rounded bg-neutral-950/70 border border-neutral-800 space-y-1">
              <span className="font-semibold text-neutral-200 text-[11px] flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Master Resume is Source of Truth
              </span>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Paste your existing Overleaf / LaTeX template below. ApplyAI retains your formatting, macros, and commands exactly. Your master template is never overwritten.
              </p>
            </div>

            <div className="flex items-center justify-between gap-2">
              <label className="text-[11px] font-medium text-neutral-300">
                Master LaTeX Template
              </label>
              <div className="flex items-center gap-1.5">
                <label
                  htmlFor="latex-file-upload"
                  className="cursor-pointer px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] flex items-center gap-1 transition-colors"
                >
                  <Upload className="w-3 h-3" />
                  <span>Upload .tex</span>
                  <input
                    id="latex-file-upload"
                    type="file"
                    accept=".tex,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
                <button
                  id="applyai-parse-master-resume-btn"
                  onClick={() => handleParseMasterResume(false)}
                  disabled={isParsing}
                  className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-800/60 rounded text-[11px] flex items-center gap-1 transition-colors disabled:opacity-50"
                  title="Extract profile, stack, and facts from this master LaTeX"
                >
                  {isParsing ? (
                    <RefreshCw className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                  )}
                  <span>{isParsing ? 'Parsing...' : 'Parse & Sync Profile'}</span>
                </button>
              </div>
            </div>

            {parseMessage && (
              <div className="p-2 rounded bg-emerald-950/40 border border-emerald-900/50 text-emerald-300 text-[11px] flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                <span>{parseMessage}</span>
              </div>
            )}

            {parseError && (
              <div className="p-2 rounded bg-red-950/40 border border-red-900/50 text-red-300 text-[11px] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>{parseError}</span>
              </div>
            )}

            <textarea
              id="settings-latex-template"
              rows={13}
              value={data.masterResume?.latexTemplate || data.resume.latexTemplate}
              onChange={(e) => {
                const val = e.target.value;
                setData((prev) =>
                  !prev
                    ? prev
                    : {
                        ...prev,
                        masterResume: { ...prev.masterResume, latexTemplate: val },
                        resume: { ...prev.resume, latexTemplate: val },
                      }
                );
              }}
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 font-mono text-[10px] text-neutral-300 focus:outline-none focus:border-neutral-600 select-text leading-relaxed"
            />

            <div className="flex items-center justify-between text-[10px] text-neutral-500 pt-1">
              <span>
                {data.masterResume?.lastParsedAt
                  ? `Profile last synced: ${data.masterResume.lastParsedAt}`
                  : 'Profile not yet synced from this template'}
              </span>
              {data.masterResume?.profile && (
                <button
                  type="button"
                  onClick={() => handleParseMasterResume(true)}
                  disabled={isParsing}
                  className="text-neutral-400 hover:text-neutral-200 underline transition-colors disabled:opacity-50"
                  title="Force a complete re-parse bypassing cached profile"
                >
                  Force re-parse
                </button>
              )}
            </div>
          </div>
        )}

        {/* Tech Stack Tab */}
        {activeTab === 'stack' && (
          <div className="space-y-3 text-xs">
            <div className="p-2.5 rounded bg-neutral-950/70 border border-neutral-800 space-y-1">
              <span className="font-semibold text-neutral-200 text-[11px] flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-sky-400" />
                Structured Tech Stack (Ground Truth)
              </span>
              <p className="text-[10px] text-neutral-400 leading-relaxed">
                Extracted from your resume. When tailoring, ApplyAI compares the Job Description against these categories and emphasizes your actual tools. Technologies not listed here will never be fabricated.
              </p>
            </div>

            <div className="space-y-2.5">
              {stackCategories.map((cat) => {
                const currentItems = data.stack?.[cat.key] || [];
                return (
                  <div key={cat.key} className="p-2 rounded bg-neutral-950 border border-neutral-800 space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-semibold text-neutral-300">
                        {cat.label}
                      </label>
                      <span className="text-[10px] font-mono text-neutral-500">
                        {currentItems.length} items
                      </span>
                    </div>

                    <input
                      type="text"
                      value={currentItems.join(', ')}
                      placeholder={cat.placeholder}
                      onChange={(e) => updateStackCategory(cat.key, e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[11px] font-mono text-neutral-200 focus:outline-none focus:border-neutral-600"
                    />

                    {currentItems.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-0.5">
                        {currentItems.map((item, idx) => (
                          <span
                            key={idx}
                            className="px-1.5 py-0.5 text-[9px] font-mono bg-neutral-800 text-neutral-300 rounded border border-neutral-700/60"
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Experience & Facts Tab */}
        {activeTab === 'facts' && (
          <div className="space-y-4 text-xs">
            <div className="p-2.5 rounded bg-neutral-950/70 border border-neutral-800 text-[11px] text-neutral-400">
              <span className="font-semibold text-neutral-200">Ground Truth Rule:</span> The AI is strictly forbidden from inventing experience or achievements outside these facts.
            </div>

            {/* Skills */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Technical Skills (flat list)
              </label>
              <textarea
                id="settings-skills-input"
                rows={2}
                value={data.resume.facts.skills.join(', ')}
                onChange={(e) => updateSkills(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded p-2 text-neutral-200 font-mono text-[11px] focus:outline-none focus:border-neutral-600"
              />
            </div>

            {/* Experience */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-medium text-neutral-300">
                  Experience ({data.resume.facts.experience.length})
                </label>
                <button
                  id="settings-add-experience-btn"
                  onClick={addExperience}
                  className="flex items-center gap-1 text-[11px] text-neutral-300 hover:text-white"
                >
                  <Plus className="w-3 h-3" /> Add Role
                </button>
              </div>

              {data.resume.facts.experience.map((exp, idx) => (
                <div key={idx} className="p-2.5 rounded bg-neutral-950 border border-neutral-800 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <input
                      type="text"
                      value={exp.role}
                      placeholder="Role title"
                      onChange={(e) => updateExperience(idx, { role: e.target.value })}
                      className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs font-semibold text-neutral-200 w-full"
                    />
                    <button
                      onClick={() => removeExperience(idx)}
                      className="text-neutral-500 hover:text-red-400 p-1"
                      title="Remove experience"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={exp.company}
                      placeholder="Company"
                      onChange={(e) => updateExperience(idx, { company: e.target.value })}
                      className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[11px] text-neutral-300"
                    />
                    <input
                      type="text"
                      value={exp.dates || ''}
                      placeholder="Dates"
                      onChange={(e) => updateExperience(idx, { dates: e.target.value })}
                      className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[11px] text-neutral-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-neutral-500 mb-0.5">Bullets (one per line):</label>
                    <textarea
                      rows={3}
                      value={exp.bullets.join('\n')}
                      onChange={(e) =>
                        updateExperience(idx, {
                          bullets: e.target.value.split('\n').filter((b) => b.trim().length > 0),
                        })
                      }
                      className="w-full bg-neutral-900 border border-neutral-800 rounded p-1.5 text-[11px] text-neutral-300 focus:outline-none"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-3 text-xs">
            <p className="text-[11px] text-neutral-400">
              Personal contact details stored locally in your browser.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">First Name</label>
                <input
                  id="settings-first-name"
                  type="text"
                  value={data.profile.firstName}
                  onChange={(e) => updateProfile('firstName', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 text-xs focus:outline-none focus:border-neutral-600"
                />
              </div>
              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">Last Name</label>
                <input
                  id="settings-last-name"
                  type="text"
                  value={data.profile.lastName}
                  onChange={(e) => updateProfile('lastName', e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 text-xs focus:outline-none focus:border-neutral-600"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Email</label>
              <input
                id="settings-email"
                type="email"
                value={data.profile.email}
                onChange={(e) => updateProfile('email', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 text-xs focus:outline-none focus:border-neutral-600"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Phone</label>
              <input
                id="settings-phone"
                type="text"
                value={data.profile.phone || ''}
                onChange={(e) => updateProfile('phone', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 text-xs focus:outline-none focus:border-neutral-600"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">LinkedIn URL</label>
              <input
                id="settings-linkedin"
                type="text"
                value={data.profile.linkedin || ''}
                onChange={(e) => updateProfile('linkedin', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 text-xs focus:outline-none focus:border-neutral-600"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">GitHub URL</label>
              <input
                id="settings-github"
                type="text"
                value={data.profile.github || ''}
                onChange={(e) => updateProfile('github', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 text-xs focus:outline-none focus:border-neutral-600"
              />
            </div>

            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">Location</label>
              <input
                id="settings-location"
                type="text"
                value={data.profile.location || ''}
                onChange={(e) => updateProfile('location', e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 text-xs focus:outline-none focus:border-neutral-600"
              />
            </div>
          </div>
        )}

        {/* Backend Tab */}
        {activeTab === 'backend' && (
          <div className="space-y-3.5 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Backend Server URL
              </label>
              <div className="flex gap-2">
                <input
                  id="settings-backend-url"
                  type="text"
                  value={data.settings.backendUrl}
                  onChange={(e) =>
                    setData((prev) =>
                      !prev
                        ? prev
                        : {
                            ...prev,
                            settings: { ...prev.settings, backendUrl: e.target.value },
                          }
                    )
                  }
                  className="flex-1 bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 text-xs font-mono focus:outline-none focus:border-neutral-600"
                  placeholder={DEFAULT_BACKEND_URL}
                />
                <button
                  type="button"
                  id="btn-reset-backend-url"
                  onClick={() =>
                    setData((prev) =>
                      !prev
                        ? prev
                        : {
                            ...prev,
                            settings: { ...prev.settings, backendUrl: DEFAULT_BACKEND_URL },
                          }
                    )
                  }
                  title="Reset to default local URL"
                  className="px-2 py-1 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded text-[11px] transition-colors whitespace-nowrap"
                >
                  Reset Default
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 mt-1">
                Default: <code>{DEFAULT_BACKEND_URL}</code>. Never uses <code>chrome-extension://</code>.
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                id="btn-test-backend-connection"
                onClick={handleTestBackend}
                disabled={isTestingBackend}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 disabled:opacity-50 text-neutral-200 rounded font-medium text-xs transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTestingBackend ? 'animate-spin' : ''}`} />
                <span>{isTestingBackend ? 'Testing Connection...' : 'Test Backend Connection'}</span>
              </button>
            </div>

            {backendTestStatus && (
              <div
                className={`p-2.5 rounded border text-[11px] space-y-1 ${
                  backendTestStatus.success
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                <div className="flex items-center gap-1.5 font-medium">
                  {backendTestStatus.success ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <AlertCircle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                  <span>{backendTestStatus.message}</span>
                </div>
                {backendTestStatus.details && (
                  <p className="text-[10px] text-neutral-400 font-mono pl-5">
                    {backendTestStatus.details}
                  </p>
                )}
              </div>
            )}

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1.5 text-[11px] text-neutral-400">
              <div className="flex items-center gap-1.5 text-neutral-200 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Security & Storage Principle</span>
              </div>
              <p>
                All extension requests resolve to <code>{DEFAULT_BACKEND_URL}/api/...</code> or your configured backend. The Gemini API key remains secured on the server side in <code>process.env.GEMINI_API_KEY</code>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
