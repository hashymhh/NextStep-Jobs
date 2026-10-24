import { useState, useEffect, useCallback } from 'react';
import { Company } from '../types';
import { DEMO_COMPANIES } from './seed/demoData';

export const COMPANIES_STORAGE_KEY = 'nextstep_v2_pk_companies_store';
export const COMPANIES_EVENT_KEY = 'nextstep_v2_pk_companies_updated';

function readCompanies(): Company[] {
  try {
    const saved = localStorage.getItem(COMPANIES_STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback
  }
  return DEMO_COMPANIES;
}

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>(readCompanies);

  useEffect(() => {
    const handleSync = () => {
      setCompanies(readCompanies());
    };
    window.addEventListener(COMPANIES_EVENT_KEY, handleSync);
    window.addEventListener('storage', handleSync);
    return () => {
      window.removeEventListener(COMPANIES_EVENT_KEY, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, []);

  const saveCompanies = useCallback((newComps: Company[]) => {
    setCompanies(newComps);
    localStorage.setItem(COMPANIES_STORAGE_KEY, JSON.stringify(newComps));
    window.dispatchEvent(new CustomEvent(COMPANIES_EVENT_KEY));
  }, []);

  const toggleFollow = useCallback(
    (companyId: string) => {
      const current = readCompanies();
      const updated = current.map((comp) => {
        if (comp.id === companyId) {
          const willFollow = !comp.is_following;
          return {
            ...comp,
            is_following: willFollow,
            followers_count: Math.max(0, comp.followers_count + (willFollow ? 1 : -1)),
          };
        }
        return comp;
      });
      saveCompanies(updated);
    },
    [saveCompanies]
  );

  const updateCompany = useCallback(
    (companyId: string, updates: Partial<Company>) => {
      const current = readCompanies();
      const updated = current.map((comp) =>
        comp.id === companyId ? { ...comp, ...updates } : comp
      );
      saveCompanies(updated);
    },
    [saveCompanies]
  );

  const createCompany = useCallback(
    (input: {
      name: string;
      industry: string;
      size: string;
      hq: string;
      tagline?: string;
      about?: string;
      website?: string;
      founded?: number;
      specialties?: string[];
      verified?: boolean;
    }) => {
      const current = readCompanies();
      const baseSlug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      const slug = current.some((c) => c.slug === baseSlug)
        ? `${baseSlug}-${Date.now().toString().slice(-4)}`
        : baseSlug;

      const created: Company = {
        id: `comp_custom_${Date.now()}`,
        slug,
        name: input.name.trim(),
        tagline: input.tagline?.trim() || `${input.industry} employer in ${input.hq}`,
        about:
          input.about?.trim() ||
          `${input.name.trim()} builds technology and enterprise products across Pakistan.`,
        industry: input.industry,
        size: input.size,
        hq: input.hq,
        website: input.website?.trim() || undefined,
        founded: input.founded || 2022,
        specialties: input.specialties || ['Software Engineering', 'Cloud Systems'],
        verified: Boolean(input.verified),
        followers_count: 120,
        is_following: false,
        status: 'active',
        created_at: new Date().toISOString(),
      };
      saveCompanies([created, ...current]);
      return created;
    },
    [saveCompanies]
  );

  const getCompanyBySlug = useCallback(
    (slug: string) => {
      return companies.find((c) => c.slug.toLowerCase() === slug.toLowerCase()) || null;
    },
    [companies]
  );

  return {
    companies,
    getCompanyBySlug,
    toggleFollow,
    updateCompany,
    createCompany,
  };
}
