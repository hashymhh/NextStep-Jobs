import { useState, useEffect, useCallback } from 'react';
import { ResumeDocument } from '../types';
import { DEMO_PROFILES } from './seed/demoData';
import { autofillResumeFromProfile } from '../features/resume/resumeUtils';
import { useAuth } from './clerk/useAuth';

const RESUME_STORAGE_KEY = 'nextstep_v2_pk_resumes';
const SYNC_EVENT = 'nextstep_v2_pk_resume_sync';

function loadResumes(defaultProfile = DEMO_PROFILES[0]): ResumeDocument[] {
  try {
    const raw = localStorage.getItem(RESUME_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return [autofillResumeFromProfile(defaultProfile, 'modern')];
}

export function useResumeStore() {
  const { profile } = useAuth();
  const activeProfile = profile || DEMO_PROFILES[0];

  const [resumes, setResumes] = useState<ResumeDocument[]>(() => loadResumes(activeProfile));
  const [activeResumeId, setActiveResumeId] = useState<string>(() => {
    const initial = loadResumes(activeProfile);
    return initial[0]?.id || 'res_default';
  });

  useEffect(() => {
    const onSync = () => {
      setResumes(loadResumes(activeProfile));
    };
    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener('storage', onSync);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener('storage', onSync);
    };
  }, [activeProfile]);

  const persist = useCallback((next: ResumeDocument[]) => {
    setResumes(next);
    localStorage.setItem(RESUME_STORAGE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT));
  }, []);

  const activeResume =
    resumes.find((r) => r.id === activeResumeId) || resumes[0] || autofillResumeFromProfile(activeProfile);

  const saveResume = useCallback(
    (updated: ResumeDocument) => {
      const stamped = { ...updated, updated_at: new Date().toISOString() };
      const current = loadResumes(activeProfile);
      const exists = current.some((r) => r.id === stamped.id);
      const next = exists
        ? current.map((r) => (r.id === stamped.id ? stamped : r))
        : [stamped, ...current];
      persist(next);
      setActiveResumeId(stamped.id);
    },
    [activeProfile, persist]
  );

  const resetFromProfile = useCallback(() => {
    const fresh = autofillResumeFromProfile(activeProfile, activeResume.template);
    fresh.id = activeResume.id;
    saveResume(fresh);
    return fresh;
  }, [activeProfile, activeResume.id, activeResume.template, saveResume]);

  const importResumeJson = useCallback(
    (rawJson: string): ResumeDocument => {
      const parsed = JSON.parse(rawJson);
      if (!parsed || typeof parsed !== 'object' || !parsed.personal?.fullName) {
        throw new Error('Invalid NextStep Resume JSON format.');
      }
      const imported: ResumeDocument = {
        ...autofillResumeFromProfile(activeProfile),
        ...parsed,
        id: `res_import_${Date.now()}`,
        updated_at: new Date().toISOString(),
      };
      const current = loadResumes(activeProfile);
      persist([imported, ...current]);
      setActiveResumeId(imported.id);
      return imported;
    },
    [activeProfile, persist]
  );

  return {
    resumes,
    activeResume,
    activeResumeId,
    setActiveResumeId,
    saveResume,
    resetFromProfile,
    importResumeJson,
  };
}
