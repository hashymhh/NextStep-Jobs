import React, { useState, useMemo, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Shell } from '../components/layout/Shell';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { useResumeStore } from '../lib/resumeStore';
import {
  calculateResumeATSScore,
  suggestPKRRoles,
  generateDefaultRoadmap,
} from '../features/resume/resumeUtils';
import { formatSalaryRangePKR, formatDateTimePKT } from '../lib/locale/pakistan';
import { ResumeDocument, ResumeTemplateId } from '../types';
import {
  FileText,
  Printer,
  Download,
  Upload,
  RefreshCw,
  Wand2,
  CheckCircle,
  AlertCircle,
  Plus,
  Trash2,
  Compass,
  Briefcase,
} from 'lucide-react';
import { toast } from 'sonner';

type BuilderPanel = 'editor' | 'ats' | 'roadmap';

export const ResumeBuilderPage: React.FC = () => {
  const { activeResume, saveResume, resetFromProfile, importResumeJson } = useResumeStore();

  const [panel, setPanel] = useState<BuilderPanel>('editor');
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [skillDraft, setSkillDraft] = useState('');
  const [aiRoadmap, setAiRoadmap] = useState<{
    days30: string[];
    days60: string[];
    days90: string[];
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const atsBreakdown = useMemo(
    () => calculateResumeATSScore(activeResume),
    [activeResume]
  );

  const suggestedRoles = useMemo(
    () => suggestPKRRoles(activeResume),
    [activeResume]
  );

  const defaultRoadmap = useMemo(
    () => generateDefaultRoadmap(activeResume.target_role, activeResume.skills),
    [activeResume.skills, activeResume.target_role]
  );

  const updateDoc = (patch: Partial<ResumeDocument>) => {
    saveResume({
      ...activeResume,
      ...patch,
    });
  };

  const updatePersonal = (field: keyof ResumeDocument['personal'], value: string) => {
    updateDoc({
      personal: {
        ...activeResume.personal,
        [field]: value,
      },
    });
  };

  const handlePrintPdf = () => {
    window.print();
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(activeResume, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${activeResume.personal.fullName.replace(/\s+/g, '_')}_NextStep_Resume.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success('Exported resume JSON file.');
  };

  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const imported = importResumeJson(String(reader.result || ''));
        toast.success(`Imported resume for ${imported.personal.fullName}`);
      } catch (err: any) {
        toast.error(err?.message || 'Could not parse Resume JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleAiSummary = async () => {
    setAiLoading('summary');
    try {
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'summary',
          targetRole: activeResume.target_role,
          skills: activeResume.skills,
          currentText: activeResume.summary,
          fullName: activeResume.personal.fullName,
        }),
      });
      const data = await res.json();
      if (data?.summary) {
        updateDoc({ summary: data.summary });
        toast.success('Generated ATS-optimized executive summary.');
      }
    } catch {
      toast.error('Unable to reach Resume AI endpoint.');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiRewriteBullets = async (expId: string) => {
    const targetExp = activeResume.experiences.find((e) => e.id === expId);
    if (!targetExp) return;
    setAiLoading(`exp_${expId}`);
    try {
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'rewrite_bullets',
          targetRole: activeResume.target_role,
          skills: activeResume.skills,
          currentText: targetExp.bullets.join('\n'),
        }),
      });
      const data = await res.json();
      if (Array.isArray(data?.bullets) && data.bullets.length > 0) {
        updateDoc({
          experiences: activeResume.experiences.map((e) =>
            e.id === expId ? { ...e, bullets: data.bullets } : e
          ),
        });
        toast.success(`Polished impact bullets for ${targetExp.company}.`);
      }
    } catch {
      toast.error('Could not rewrite bullets right now.');
    } finally {
      setAiLoading(null);
    }
  };

  const handleAiGenerateRoadmap = async () => {
    setAiLoading('roadmap');
    try {
      const res = await fetch('/api/ai/resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'roadmap',
          targetRole: activeResume.target_role,
          skills: activeResume.skills,
        }),
      });
      const data = await res.json();
      if (data?.days30 && data?.days60 && data?.days90) {
        setAiRoadmap(data);
        toast.success('Generated personalized 30/60/90-day Next Skills roadmap.');
      }
    } catch {
      toast.error('Unable to generate AI roadmap right now.');
    } finally {
      setAiLoading(null);
    }
  };

  const addExperienceBlock = () => {
    updateDoc({
      experiences: [
        {
          id: `res_exp_${Date.now()}`,
          title: 'Software Engineer',
          company: 'SadaPay',
          location: 'Islamabad, Pakistan',
          startDate: '2024-01',
          endDate: 'Present',
          bullets: [
            'Engineered resilient TypeScript microservices handling real-time RAAST transfers across Pakistan.',
          ],
        },
        ...activeResume.experiences,
      ],
    });
  };

  const addSkillTag = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = skillDraft.trim();
    if (!cleaned) return;
    if (!activeResume.skills.includes(cleaned)) {
      updateDoc({ skills: [...activeResume.skills, cleaned] });
    }
    setSkillDraft('');
  };

  const templates: { id: ResumeTemplateId; label: string }[] = [
    { id: 'modern', label: 'Modern' },
    { id: 'classic', label: 'Classic' },
    { id: 'compact', label: 'Compact' },
  ];

  return (
    <Shell hideLeftRail hideRightRail fullWidth>
      <div className="space-y-4">
        {/* Top Action Toolbar (.no-print) */}
        <div className="no-print bg-white dark:bg-[#1B1F23] border border-[#E0DFDC] dark:border-[#38434F] rounded-xl p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#0A66C2] dark:text-[#71B7FB] shrink-0" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                ATS Resume Builder &amp; AI Career Suite
              </h1>
            </div>
            <p className="text-xs text-gray-500 tabular-nums mt-0.5">
              ATS Score: <strong className="text-emerald-700 dark:text-emerald-400">{atsBreakdown.score}/100 ({atsBreakdown.grade})</strong> · Last saved {formatDateTimePKT(activeResume.updated_at)}
            </p>
          </div>

          <div className="flex flex-wrap xl:flex-nowrap items-center gap-2 shrink-0">
            {/* Template Selector */}
            <div
              role="group"
              aria-label="Resume layout template"
              className="inline-flex p-1 rounded-lg bg-gray-100 dark:bg-gray-800 gap-1"
            >
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => updateDoc({ template: tpl.id })}
                  className={`px-3 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                    activeResume.template === tpl.id
                      ? 'bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {tpl.label}
                </button>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<RefreshCw className="w-3.5 h-3.5" />}
              onClick={() => {
                resetFromProfile();
                toast.success('Autofilled resume from your NextStep profile.');
              }}
            >
              Autofill Profile
            </Button>

            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportJsonFile}
              className="hidden"
            />
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Upload className="w-3.5 h-3.5" />}
              onClick={() => fileInputRef.current?.click()}
            >
              Import JSON
            </Button>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Download className="w-3.5 h-3.5" />}
              onClick={handleExportJson}
            >
              Export JSON
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Printer className="w-3.5 h-3.5" />}
              onClick={handlePrintPdf}
            >
              Export PDF
            </Button>
          </div>
        </div>

        {/* Split-Screen Workspace: Left Controls (.no-print) + Right Live A4 Sheet (#resume-print-sheet) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* LEFT PANE: EDITOR, ATS SCORER & 30/60/90 ROADMAP */}
          <div className="no-print lg:col-span-5 space-y-4">
            <div
              role="tablist"
              aria-label="Resume builder tools"
              className="flex p-1 rounded-lg bg-white dark:bg-[#1B1F23] border border-[#E0DFDC] dark:border-[#38434F] gap-1"
            >
              <button
                role="tab"
                aria-selected={panel === 'editor'}
                type="button"
                onClick={() => setPanel('editor')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  panel === 'editor'
                    ? 'bg-[#0A66C2] text-white'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                Content &amp; AI Writer
              </button>
              <button
                role="tab"
                aria-selected={panel === 'ats'}
                type="button"
                onClick={() => setPanel('ats')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap tabular-nums ${
                  panel === 'ats'
                    ? 'bg-[#0A66C2] text-white'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                ATS Score ({atsBreakdown.score}) &amp; PKR Roles
              </button>
              <button
                role="tab"
                aria-selected={panel === 'roadmap'}
                type="button"
                onClick={() => setPanel('roadmap')}
                className={`flex-1 py-1.5 px-3 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                  panel === 'roadmap'
                    ? 'bg-[#0A66C2] text-white'
                    : 'text-gray-600 dark:text-gray-300'
                }`}
              >
                30/60/90 Roadmap
              </button>
            </div>

            {/* SUBPANEL 1: EDITOR & AI WRITER */}
            {panel === 'editor' && (
              <div className="space-y-4">
                <Card padding="md" className="space-y-3">
                  <h2 className="text-xs font-bold text-gray-900 dark:text-white">
                    Target Role &amp; Contact Header
                  </h2>
                  <div>
                    <label
                      htmlFor="res-target-role"
                      className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1"
                    >
                      Target Role (drives ATS keyword alignment &amp; AI writing prompts)
                    </label>
                    <input
                      id="res-target-role"
                      type="text"
                      value={activeResume.target_role}
                      onChange={(e) => updateDoc({ target_role: e.target.value })}
                      className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label
                        htmlFor="res-fullname"
                        className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1"
                      >
                        Full Name
                      </label>
                      <input
                        id="res-fullname"
                        type="text"
                        value={activeResume.personal.fullName}
                        onChange={(e) => updatePersonal('fullName', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="res-headline"
                        className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1"
                      >
                        Professional Headline
                      </label>
                      <input
                        id="res-headline"
                        type="text"
                        value={activeResume.personal.headline}
                        onChange={(e) => updatePersonal('headline', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="res-phone"
                        className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1"
                      >
                        Phone (+92)
                      </label>
                      <input
                        id="res-phone"
                        type="text"
                        value={activeResume.personal.phone}
                        onChange={(e) => updatePersonal('phone', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="res-location"
                        className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1"
                      >
                        City &amp; Country
                      </label>
                      <input
                        id="res-location"
                        type="text"
                        value={activeResume.personal.location}
                        onChange={(e) => updatePersonal('location', e.target.value)}
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white"
                      />
                    </div>
                  </div>
                </Card>

                {/* Executive Summary + Gemini Writer */}
                <Card padding="md" className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="res-summary"
                      className="text-xs font-bold text-gray-900 dark:text-white"
                    >
                      Executive Summary
                    </label>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs"
                      isLoading={aiLoading === 'summary'}
                      leftIcon={<Wand2 className="w-3 h-3" />}
                      onClick={handleAiSummary}
                    >
                      AI Polish Summary
                    </Button>
                  </div>
                  <textarea
                    id="res-summary"
                    rows={4}
                    value={activeResume.summary}
                    onChange={(e) => updateDoc({ summary: e.target.value })}
                    className="w-full text-xs px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white leading-relaxed"
                  />
                </Card>

                {/* Experience & AI Bullet Rewriter */}
                <Card padding="md" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xs font-bold text-gray-900 dark:text-white">
                      Work Experience ({activeResume.experiences.length})
                    </h2>
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="h-7 text-xs"
                      leftIcon={<Plus className="w-3 h-3" />}
                      onClick={addExperienceBlock}
                    >
                      Add Role
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {activeResume.experiences.map((exp, idx) => (
                      <div
                        key={exp.id}
                        className="p-3 rounded-lg bg-gray-50 dark:bg-[#12161A] border border-gray-200 dark:border-gray-800 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            aria-label={`Role title ${idx + 1}`}
                            value={exp.title}
                            onChange={(e) =>
                              updateDoc({
                                experiences: activeResume.experiences.map((item) =>
                                  item.id === exp.id ? { ...item, title: e.target.value } : item
                                ),
                              })
                            }
                            className="flex-1 text-xs font-bold px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white"
                          />
                          <button
                            type="button"
                            aria-label={`Remove experience ${exp.company}`}
                            onClick={() =>
                              updateDoc({
                                experiences: activeResume.experiences.filter(
                                  (item) => item.id !== exp.id
                                ),
                              })
                            }
                            className="p-1 text-gray-400 hover:text-[#CC1016] cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            aria-label={`Company ${idx + 1}`}
                            value={exp.company}
                            onChange={(e) =>
                              updateDoc({
                                experiences: activeResume.experiences.map((item) =>
                                  item.id === exp.id ? { ...item, company: e.target.value } : item
                                ),
                              })
                            }
                            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white"
                          />
                          <input
                            type="text"
                            aria-label={`Dates ${idx + 1}`}
                            value={`${exp.startDate} – ${exp.endDate}`}
                            onChange={(e) => {
                              const [st = '', en = 'Present'] = e.target.value
                                .split(/–|-/)
                                .map((s) => s.trim());
                              updateDoc({
                                experiences: activeResume.experiences.map((item) =>
                                  item.id === exp.id
                                    ? { ...item, startDate: st, endDate: en }
                                    : item
                                ),
                              });
                            }}
                            className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white tabular-nums"
                          />
                        </div>

                        <textarea
                          rows={3}
                          aria-label={`Impact bullets for ${exp.company}`}
                          value={exp.bullets.join('\n')}
                          onChange={(e) =>
                            updateDoc({
                              experiences: activeResume.experiences.map((item) =>
                                item.id === exp.id
                                  ? {
                                      ...item,
                                      bullets: e.target.value
                                        .split('\n')
                                        .map((b) => b.trim())
                                        .filter(Boolean),
                                    }
                                  : item
                              ),
                            })
                          }
                          className="w-full text-xs px-2.5 py-1.5 rounded border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#1B1F23] text-gray-900 dark:text-white"
                        />

                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            className="h-7 text-xs"
                            isLoading={aiLoading === `exp_${exp.id}`}
                            leftIcon={<Wand2 className="w-3 h-3" />}
                            onClick={() => handleAiRewriteBullets(exp.id)}
                          >
                            AI Rewrite Bullets
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Skills Matrix */}
                <Card padding="md" className="space-y-2.5">
                  <h2 className="text-xs font-bold text-gray-900 dark:text-white">
                    ATS Technical Skills ({activeResume.skills.length})
                  </h2>
                  <form onSubmit={addSkillTag} className="flex gap-2">
                    <input
                      type="text"
                      aria-label="Add technical skill"
                      placeholder="Add skill (e.g. Kubernetes, RAAST, Go)..."
                      value={skillDraft}
                      onChange={(e) => setSkillDraft(e.target.value)}
                      className="flex-1 text-xs px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#12161A] text-gray-900 dark:text-white"
                    />
                    <Button type="submit" variant="secondary" size="sm">
                      Add
                    </Button>
                  </form>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {activeResume.skills.map((sk) => (
                      <button
                        key={sk}
                        type="button"
                        title={`Remove ${sk}`}
                        onClick={() =>
                          updateDoc({
                            skills: activeResume.skills.filter((s) => s !== sk),
                          })
                        }
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs text-gray-800 dark:text-gray-200 hover:bg-red-50 hover:text-[#CC1016] cursor-pointer"
                      >
                        <span>{sk}</span>
                        <span aria-hidden="true">×</span>
                      </button>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* SUBPANEL 2: ATS SCORER & PKR ROLE SUGGESTER */}
            {panel === 'ats' && (
              <div className="space-y-4">
                <Card padding="md" className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                        ATS Readiness Audit
                      </h2>
                      <p className="text-xs text-gray-500">
                        Evaluated against Pakistani &amp; global engineering ATS parsers
                      </p>
                    </div>
                    <div className="text-right tabular-nums">
                      <span className="text-2xl font-bold text-[#0A66C2] dark:text-[#71B7FB]">
                        {atsBreakdown.score}%
                      </span>
                      <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                        {atsBreakdown.grade}
                      </p>
                    </div>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-gray-800 text-xs">
                    {atsBreakdown.checks.map((chk) => (
                      <div key={chk.id} className="py-2.5 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white flex items-center gap-1.5">
                            {chk.passed ? (
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            )}
                            {chk.label}
                          </span>
                          <span className="font-mono tabular-nums text-gray-500">
                            +{chk.points} pts
                          </span>
                        </div>
                        {!chk.passed && (
                          <p className="text-[11px] text-amber-700 dark:text-amber-400 pl-5">
                            {chk.tip}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>

                {/* PKR Role Suggester */}
                <Card padding="md" className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#0A66C2]" />
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                      Suggested Pakistan Tech Roles (PKR Benchmarks)
                    </h2>
                  </div>

                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {suggestedRoles.map((role) => (
                      <div key={role.title} className="py-3 first:pt-0 last:pb-0 space-y-1 text-xs">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-bold text-gray-900 dark:text-white">
                            {role.title}
                          </p>
                          <span className="font-mono tabular-nums font-semibold text-[#0A66C2] dark:text-[#71B7FB]">
                            {role.fitScore}% Fit
                          </span>
                        </div>
                        <p className="font-semibold text-emerald-700 dark:text-emerald-400 tabular-nums">
                          {formatSalaryRangePKR(role.monthlyMinPKR, role.monthlyMaxPKR, 'PKR', 'monthly')}
                        </p>
                        <p className="text-[11px] text-gray-500">
                          {role.topHubs}
                        </p>
                        <div className="pt-1 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              updateDoc({ target_role: role.title });
                              toast.success(`Set target role to "${role.title}"`);
                            }}
                            className="text-[11px] font-semibold text-[#0A66C2] dark:text-[#71B7FB] hover:underline cursor-pointer"
                          >
                            Target this role
                          </button>
                          <span aria-hidden="true" className="text-gray-300">·</span>
                          <Link
                            to={`/jobs`}
                            className="text-[11px] font-semibold text-gray-600 dark:text-gray-400 hover:underline"
                          >
                            Browse matching jobs
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* SUBPANEL 3: 30 / 60 / 90 DAY NEXT SKILLS ROADMAP */}
            {panel === 'roadmap' && (
              <Card padding="md" className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-[#0A66C2]" />
                      <span>30 / 60 / 90-Day Next Skills Roadmap</span>
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Tailored for {activeResume.target_role}
                    </p>
                  </div>

                  <Button
                    variant="primary"
                    size="sm"
                    isLoading={aiLoading === 'roadmap'}
                    leftIcon={<Wand2 className="w-3.5 h-3.5" />}
                    onClick={handleAiGenerateRoadmap}
                  >
                    Refresh Roadmap
                  </Button>
                </div>

                {aiRoadmap ? (
                  <div className="space-y-3 text-xs">
                    {[
                      { label: '01. First 30 Days — Core Mastery', items: aiRoadmap.days30 },
                      { label: '02. Day 31 to 60 — Production Scale', items: aiRoadmap.days60 },
                      { label: '03. Day 61 to 90 — Staff Readiness & PKR Offers', items: aiRoadmap.days90 },
                    ].map((phase) => (
                      <div
                        key={phase.label}
                        className="p-3.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#12161A] space-y-1.5"
                      >
                        <h3 className="font-bold text-gray-900 dark:text-white">{phase.label}</h3>
                        <ul className="list-disc pl-4 space-y-1 text-gray-700 dark:text-gray-300">
                          {phase.items.map((pt, i) => (
                            <li key={i}>{pt}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {defaultRoadmap.map((milestone, idx) => (
                      <div
                        key={milestone.horizon}
                        className="p-3.5 rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50/70 dark:bg-[#12161A] space-y-1.5"
                      >
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            0{idx + 1}. {milestone.horizon} — {milestone.focus}
                          </h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-400">
                          <strong>Skills:</strong> {milestone.skillsToAcquire.join(' · ') || 'Advanced System Architecture'}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                          <strong>Deliverable:</strong> {milestone.deliverable}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}
          </div>

          {/* RIGHT PANE: LIVE A4 PRINTABLE RESUME SHEET (#resume-print-sheet) */}
          <div className="lg:col-span-7">
            <div
              id="resume-print-sheet"
              className={`bg-white text-slate-900 border border-[#E0DFDC] dark:border-[#38434F] rounded-xl shadow-sm min-h-[840px] ${
                activeResume.template === 'compact'
                  ? 'p-6 text-[11px] leading-snug'
                  : activeResume.template === 'classic'
                  ? 'p-8 sm:p-10 font-serif text-xs leading-relaxed'
                  : 'p-8 sm:p-10 text-xs leading-relaxed'
              }`}
            >
              {/* RESUME HEADER */}
              <header
                className={
                  activeResume.template === 'classic'
                    ? 'text-center pb-4 mb-5 border-b-2 border-slate-900'
                    : activeResume.template === 'compact'
                    ? 'flex flex-col sm:flex-row sm:items-baseline justify-between pb-3 mb-4 border-b border-slate-300 gap-2'
                    : 'pb-4 mb-5 border-b-2 border-[#0A66C2]'
                }
              >
                <div>
                  <h2
                    className={
                      activeResume.template === 'compact'
                        ? 'text-xl font-bold tracking-tight text-slate-900'
                        : 'text-2xl sm:text-3xl font-bold tracking-tight text-slate-900'
                    }
                  >
                    {activeResume.personal.fullName}
                  </h2>
                  <p
                    className={
                      activeResume.template === 'modern'
                        ? 'text-sm font-semibold text-[#0A66C2] mt-0.5'
                        : 'text-xs font-semibold text-slate-700 mt-0.5'
                    }
                  >
                    {activeResume.personal.headline}
                  </p>
                </div>

                <div
                  className={
                    activeResume.template === 'classic'
                      ? 'flex flex-wrap justify-center gap-x-2 gap-y-1 text-[11px] text-slate-600 mt-2'
                      : activeResume.template === 'compact'
                      ? 'text-[10.5px] text-slate-600 sm:text-right'
                      : 'flex flex-wrap gap-x-2 gap-y-1 text-[11px] text-slate-600 mt-2'
                  }
                >
                  <span>{activeResume.personal.location}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeResume.personal.phone}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeResume.personal.email}</span>
                  {activeResume.personal.linkedin && (
                    <>
                      <span aria-hidden="true">·</span>
                      <span>{activeResume.personal.linkedin}</span>
                    </>
                  )}
                </div>
              </header>

              {/* SUMMARY */}
              {activeResume.summary && (
                <section className="mb-5">
                  <h3
                    className={`font-bold uppercase tracking-wider mb-1.5 ${
                      activeResume.template === 'modern'
                        ? 'text-[11px] text-[#0A66C2]'
                        : 'text-[11px] text-slate-900 border-b border-slate-200 pb-0.5'
                    }`}
                  >
                    Executive Summary
                  </h3>
                  <p className="text-slate-800">{activeResume.summary}</p>
                </section>
              )}

              {/* TECHNICAL SKILLS */}
              {activeResume.skills.length > 0 && (
                <section className="mb-5">
                  <h3
                    className={`font-bold uppercase tracking-wider mb-1.5 ${
                      activeResume.template === 'modern'
                        ? 'text-[11px] text-[#0A66C2]'
                        : 'text-[11px] text-slate-900 border-b border-slate-200 pb-0.5'
                    }`}
                  >
                    Core Technical Competencies
                  </h3>
                  <p className="text-slate-800 font-medium">
                    {activeResume.skills.join(' · ')}
                  </p>
                </section>
              )}

              {/* WORK EXPERIENCE */}
              <section className="mb-5">
                <h3
                  className={`font-bold uppercase tracking-wider mb-2.5 ${
                    activeResume.template === 'modern'
                      ? 'text-[11px] text-[#0A66C2]'
                      : 'text-[11px] text-slate-900 border-b border-slate-200 pb-0.5'
                  }`}
                >
                  Professional Experience
                </h3>
                <div className="space-y-3.5">
                  {activeResume.experiences.map((exp) => (
                    <div key={exp.id}>
                      <div className="flex items-baseline justify-between gap-2">
                        <h4 className="font-bold text-slate-900">
                          {exp.title} — <span className="font-semibold text-slate-700">{exp.company}</span>
                        </h4>
                        <span className="text-[11px] text-slate-600 tabular-nums shrink-0">
                          {exp.startDate} – {exp.endDate}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 mb-1">{exp.location}</p>
                      <ul className="list-disc pl-4 space-y-1 text-slate-800">
                        {exp.bullets.map((b, idx) => (
                          <li key={idx}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </section>

              {/* PROJECTS */}
              {activeResume.projects.length > 0 && (
                <section className="mb-5">
                  <h3
                    className={`font-bold uppercase tracking-wider mb-2 ${
                      activeResume.template === 'modern'
                        ? 'text-[11px] text-[#0A66C2]'
                        : 'text-[11px] text-slate-900 border-b border-slate-200 pb-0.5'
                    }`}
                  >
                    Selected Engineering Projects
                  </h3>
                  <div className="space-y-2">
                    {activeResume.projects.map((proj) => (
                      <div key={proj.id}>
                        <p className="font-bold text-slate-900">
                          {proj.name}{' '}
                          {proj.link && (
                            <span className="font-normal text-[11px] text-slate-500">
                              ({proj.link})
                            </span>
                          )}
                        </p>
                        <p className="text-slate-700">{proj.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* EDUCATION & CERTIFICATIONS */}
              <section>
                <h3
                  className={`font-bold uppercase tracking-wider mb-2 ${
                    activeResume.template === 'modern'
                      ? 'text-[11px] text-[#0A66C2]'
                      : 'text-[11px] text-slate-900 border-b border-slate-200 pb-0.5'
                  }`}
                >
                  Education &amp; Certifications
                </h3>
                <div className="space-y-1.5">
                  {activeResume.educations.map((edu) => (
                    <div key={edu.id} className="flex items-baseline justify-between gap-2">
                      <p className="text-slate-900">
                        <strong>{edu.school}</strong> — {edu.degree}{' '}
                        {edu.grade ? `(GPA: ${edu.grade})` : ''}
                      </p>
                      <span className="text-[11px] text-slate-600 tabular-nums shrink-0">
                        {edu.year}
                      </span>
                    </div>
                  ))}
                  {activeResume.certifications.length > 0 && (
                    <p className="text-slate-700 pt-1">
                      <strong>Certifications:</strong> {activeResume.certifications.join(' · ')}
                    </p>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};
