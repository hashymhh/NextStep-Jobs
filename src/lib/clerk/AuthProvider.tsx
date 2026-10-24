import React, { createContext, useContext, useState, useEffect } from 'react';
import { ClerkProvider, useUser as useClerkUser, useAuth as useClerkAuth } from '@clerk/clerk-react';
import { Profile, UserRole } from '../../types';
import { DEMO_PROFILES } from '../seed/demoData';

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || '';
export const isClerkConfigured = Boolean(
  clerkPubKey && 
  (clerkPubKey.startsWith('pk_test_') || clerkPubKey.startsWith('pk_live_'))
);

interface AuthContextType {
  isLoaded: boolean;
  isSignedIn: boolean;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    imageUrl?: string;
  } | null;
  profile: Profile | null;
  role: UserRole;
  isAdmin: boolean;
  isVerifiedRecruiter: boolean;
  isDemoMode: boolean;
  needsOnboarding: boolean;
  switchPersona: (personaId: string) => void;
  updateProfile: (updates: Partial<Profile>) => void;
  completeOnboarding: (data: {
    role: UserRole;
    headline: string;
    location: string;
    skills: string[];
    open_to_work: boolean;
    open_to_hiring: boolean;
  }) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local Mock Provider for Demo Mode or missing Clerk credentials
const LocalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePersonaId, setActivePersonaId] = useState<string>(() => {
    return localStorage.getItem('nextstep_v2_pk_persona') || 'usr_candidate_john';
  });

  const [profiles, setProfiles] = useState<Profile[]>(() => {
    const saved = localStorage.getItem('nextstep_v2_pk_profiles_store');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        // fallback to seed
      }
    }
    return DEMO_PROFILES;
  });

  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(() => {
    return localStorage.getItem('nextstep_v2_pk_needs_onboarding') === 'true';
  });

  const currentProfile = profiles.find((p) => p.id === activePersonaId) || profiles[0];

  useEffect(() => {
    localStorage.setItem('nextstep_v2_pk_profiles_store', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    const syncProfiles = () => {
      try {
        const raw = localStorage.getItem('nextstep_v2_pk_profiles_store');
        if (raw) setProfiles(JSON.parse(raw));
      } catch {
        // ignore
      }
    };
    window.addEventListener('nextstep_v2_pk_admin_sync', syncProfiles);
    window.addEventListener('storage', syncProfiles);
    return () => {
      window.removeEventListener('nextstep_v2_pk_admin_sync', syncProfiles);
      window.removeEventListener('storage', syncProfiles);
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('nextstep_v2_pk_persona', activePersonaId);
  }, [activePersonaId]);

  const switchPersona = (personaId: string) => {
    const found = profiles.find((p) => p.id === personaId);
    if (found) {
      localStorage.setItem('nextstep_v2_pk_persona', personaId);
      setActivePersonaId(personaId);
      setNeedsOnboarding(false);
      localStorage.removeItem('nextstep_needs_onboarding');
    }
  };

  const updateProfile = (updates: Partial<Profile>) => {
    setProfiles((prev) =>
      prev.map((p) => (p.id === currentProfile.id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p))
    );
  };

  const completeOnboarding = (data: {
    role: UserRole;
    headline: string;
    location: string;
    skills: string[];
    open_to_work: boolean;
    open_to_hiring: boolean;
  }) => {
    updateProfile({
      role: data.role,
      headline: data.headline,
      location: data.location,
      open_to_work: data.open_to_work,
      open_to_hiring: data.open_to_hiring,
      completeness_score: Math.min(100, (currentProfile.completeness_score || 50) + 30),
    });
    setNeedsOnboarding(false);
    localStorage.removeItem('nextstep_needs_onboarding');
  };

  const signOut = () => {
    // Reset to Candidate persona or set guest
    setActivePersonaId('usr_candidate_john');
  };

  const authUser = currentProfile
    ? {
        id: currentProfile.id,
        email: currentProfile.email,
        firstName: currentProfile.first_name,
        lastName: currentProfile.last_name,
        imageUrl: currentProfile.avatar_url,
      }
    : null;

  const value: AuthContextType = {
    isLoaded: true,
    isSignedIn: Boolean(currentProfile),
    user: authUser,
    profile: currentProfile,
    role: currentProfile ? currentProfile.role : 'candidate',
    isAdmin: currentProfile?.role === 'admin' && currentProfile.status === 'active',
    isVerifiedRecruiter: currentProfile?.role === 'recruiter' && currentProfile.verified && currentProfile.status === 'active',
    isDemoMode: true,
    needsOnboarding,
    switchPersona,
    updateProfile,
    completeOnboarding,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Clerk-wrapped consumer
const ClerkAuthConsumer: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const clerkUser = useClerkUser();
  const clerkAuth = useClerkAuth();

  const [profile, setProfile] = useState<Profile | null>(() => {
    const saved = localStorage.getItem('nextstep_clerk_profile');
    return saved ? JSON.parse(saved) : null;
  });

  const [needsOnboarding, setNeedsOnboarding] = useState<boolean>(false);

  useEffect(() => {
    if (clerkUser.isLoaded && clerkUser.user) {
      const u = clerkUser.user;
      const email = u.primaryEmailAddress?.emailAddress || '';
      const firstName = u.firstName || 'User';
      const lastName = u.lastName || '';
      const handle = (u.username || `${firstName}${lastName}`.toLowerCase().replace(/[^a-z0-9]/g, '')) || 'user';
      
      const newProfile: Profile = {
        id: u.id,
        handle,
        email,
        first_name: firstName,
        last_name: lastName,
        headline: 'NextStep Professional',
        about: '',
        location: '',
        avatar_url: u.imageUrl,
        role: 'candidate',
        verified: false,
        status: 'active',
        open_to_work: true,
        open_to_hiring: false,
        completeness_score: 40,
        profile_views_count: 0,
        connections_count: 0,
        followers_count: 0,
        following_count: 0,
        settings: {
          theme: 'system',
          profileVisibility: 'public',
          whoCanMessage: 'anyone',
          whoCanSeeConnections: 'anyone',
          emailNotifications: true,
          jobAlerts: true,
        },
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setProfile(newProfile);
      localStorage.setItem('nextstep_clerk_profile', JSON.stringify(newProfile));
    }
  }, [clerkUser.isLoaded, clerkUser.user]);

  const updateProfile = (updates: Partial<Profile>) => {
    if (!profile) return;
    const updated = { ...profile, ...updates, updated_at: new Date().toISOString() };
    setProfile(updated);
    localStorage.setItem('nextstep_clerk_profile', JSON.stringify(updated));
  };

  const completeOnboarding = (data: {
    role: UserRole;
    headline: string;
    location: string;
    skills: string[];
    open_to_work: boolean;
    open_to_hiring: boolean;
  }) => {
    updateProfile({
      role: data.role,
      headline: data.headline,
      location: data.location,
      open_to_work: data.open_to_work,
      open_to_hiring: data.open_to_hiring,
      completeness_score: 80,
    });
    setNeedsOnboarding(false);
  };

  const authUser = clerkUser.user
    ? {
        id: clerkUser.user.id,
        email: clerkUser.user.primaryEmailAddress?.emailAddress || '',
        firstName: clerkUser.user.firstName || '',
        lastName: clerkUser.user.lastName || '',
        imageUrl: clerkUser.user.imageUrl,
      }
    : null;

  const value: AuthContextType = {
    isLoaded: clerkUser.isLoaded,
    isSignedIn: Boolean(clerkUser.isSignedIn),
    user: authUser,
    profile,
    role: profile?.role || 'candidate',
    isAdmin: profile?.role === 'admin' && profile.status === 'active',
    isVerifiedRecruiter: profile?.role === 'recruiter' && Boolean(profile.verified) && profile.status === 'active',
    isDemoMode: false,
    needsOnboarding,
    switchPersona: () => {},
    updateProfile,
    completeOnboarding,
    signOut: () => clerkAuth.signOut(),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const NextStepAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  if (isClerkConfigured) {
    return (
      <ClerkProvider publishableKey={clerkPubKey}>
        <ClerkAuthConsumer>{children}</ClerkAuthConsumer>
      </ClerkProvider>
    );
  }

  // Graceful Demo Mode Provider
  return <LocalAuthProvider>{children}</LocalAuthProvider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within NextStepAuthProvider');
  }
  return context;
};
