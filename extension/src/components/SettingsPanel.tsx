import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, RotateCcw, Check, Plus, Trash2, Code2, User, Briefcase, Server, CheckCircle2 } from 'lucide-react';
import { StoredData, ExperienceFact, ProjectFact } from '../types';
import { getStoredData, saveStoredData, resetToDefaults } from '../storage/storage';

interface SettingsPanelProps {
  onBack: () => void;
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({ onBack }) => {
  const [data, setData] = useState<StoredData | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'facts' | 'latex' | 'backend'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

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

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await saveStoredData(data);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Error saving settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = async () => {
    if (window.confirm('Reset all profile, resume facts, and settings to default sample data?')) {
      const reset = await resetToDefaults();
      setData(reset);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    }
  };

  // Profile handlers
  const updateProfile = (field: keyof StoredData['profile'], val: string) => {
    setData((prev) => (!prev ? prev : { ...prev, profile: { ...prev.profile, [field]: val } }));
  };

  // Facts handlers
  const updateSkills = (csv: string) => {
    const list = csv.split(',').map((s) => s.trim()).filter(Boolean);
    setData((prev) => (!prev ? prev : { ...prev, resume: { ...prev.resume, facts: { ...prev.resume.facts, skills: list } } }));
  };

  const addExperience = () => {
    const newExp: ExperienceFact = {
      company: 'New Company',
      role: 'Software Engineer',
      dates: '2023 -- Present',
      bullets: ['Engineered key feature achieving measurable performance increase.'],
      technologies: ['TypeScript', 'React'],
    };
    setData((prev) => (!prev ? prev : {
      ...prev,
      resume: {
        ...prev.resume,
        facts: {
          ...prev.resume.facts,
          experience: [newExp, ...prev.resume.facts.experience],
        },
      },
    }));
  };

  const removeExperience = (index: number) => {
    setData((prev) => (!prev ? prev : {
      ...prev,
      resume: {
        ...prev.resume,
        facts: {
          ...prev.resume.facts,
          experience: prev.resume.facts.experience.filter((_, i) => i !== index),
        },
      },
    }));
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
          <span className="font-semibold text-neutral-200 text-xs">Settings & Resume Data</span>
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

      {/* Tabs */}
      <div className="flex border-b border-neutral-800 text-xs px-2 bg-neutral-950/60 overflow-x-auto">
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
          id="applyai-tab-facts"
          onClick={() => setActiveTab('facts')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'facts'
              ? 'border-neutral-200 text-neutral-100'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          }`}
        >
          <Briefcase className="w-3 h-3" />
          <span>Resume Facts</span>
        </button>
        <button
          id="applyai-tab-latex"
          onClick={() => setActiveTab('latex')}
          className={`px-3 py-2 border-b-2 font-medium flex items-center gap-1.5 whitespace-nowrap transition-colors ${
            activeTab === 'latex'
              ? 'border-neutral-200 text-neutral-100'
              : 'border-transparent text-neutral-400 hover:text-neutral-300'
          }`}
        >
          <Code2 className="w-3 h-3" />
          <span>Master LaTeX</span>
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

        {activeTab === 'facts' && (
          <div className="space-y-4 text-xs">
            <div className="p-2.5 rounded bg-neutral-950/70 border border-neutral-800 text-[11px] text-neutral-400">
              <span className="font-semibold text-neutral-200">Ground Truth Rule:</span> The AI is strictly forbidden from inventing experience or skills outside these facts.
            </div>

            {/* Skills */}
            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Technical Skills (comma-separated)
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

        {activeTab === 'latex' && (
          <div className="space-y-2 text-xs">
            <p className="text-[11px] text-neutral-400">
              Paste your master LaTeX template from Overleaf. ApplyAI preserves formatting and commands while tailoring content.
            </p>
            <textarea
              id="settings-latex-template"
              rows={14}
              value={data.resume.latexTemplate}
              onChange={(e) =>
                setData((prev) =>
                  !prev
                    ? prev
                    : {
                        ...prev,
                        resume: { ...prev.resume, latexTemplate: e.target.value },
                      }
                )
              }
              className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 font-mono text-[10px] text-neutral-300 focus:outline-none focus:border-neutral-600 select-text leading-relaxed"
            />
          </div>
        )}

        {activeTab === 'backend' && (
          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-[11px] font-medium text-neutral-300 mb-1">
                Backend Server URL
              </label>
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
                className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-neutral-200 text-xs font-mono focus:outline-none focus:border-neutral-600"
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Default: <code>http://localhost:3000</code> or your hosted backend endpoint.
              </p>
            </div>

            <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg space-y-1.5 text-[11px] text-neutral-400">
              <div className="flex items-center gap-1.5 text-neutral-200 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Security Notice</span>
              </div>
              <p>
                The Gemini API key is securely held inside the local backend <code>.env</code> file and is never stored in Chrome or sent to the browser extension.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
