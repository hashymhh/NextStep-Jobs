import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/clerk/useAuth';
import { useAdminStore } from '../../lib/adminStore';
import { Shell } from './Shell';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { ShieldAlert, Lock, ShieldCheck, ArrowLeft, UserCheck } from 'lucide-react';
import { UserRole } from '../../types';
import { toast } from 'sonner';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isSignedIn, isLoaded, profile, isDemoMode, switchPersona } = useAuth();
  const location = useLocation();

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F4F2EE] dark:bg-[#0D1117]">
        <div className="w-8 h-8 border-2 border-[#0A66C2] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" state={{ from: location }} replace />;
  }

  if (profile?.status === 'suspended' || profile?.status === 'banned') {
    return (
      <Shell hideLeftRail hideRightRail>
        <div className="min-h-[65vh] flex items-center justify-center p-4">
          <Card className="max-w-md w-full text-center p-6 border-red-300 dark:border-red-900">
            <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950/60 text-[#CC1016] mx-auto flex items-center justify-center mb-4">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Account {profile.status === 'banned' ? 'Banned' : 'Suspended'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              Your account has been {profile.status} by NextStep Pakistan Trust &amp; Safety administrators. If you believe this is an error, contact compliance@nextstep.pk.
            </p>
            {isDemoMode && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  switchPersona('usr_candidate_john');
                  toast.success('Switched back to active persona: Hamza Tariq');
                }}
              >
                Switch to Active Demo Persona
              </Button>
            )}
          </Card>
        </div>
      </Shell>
    );
  }

  return <>{children}</>;
};

export const RoleRoute: React.FC<{
  allowedRoles: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const { profile, role, isAdmin, isDemoMode, switchPersona } = useAuth();
  const { getOperatorScopes } = useAdminStore();
  const navigate = useNavigate();

  const delegatedScopes = profile ? getOperatorScopes(profile.id, isAdmin) : [];
  const hasDelegatedAdmin = allowedRoles.includes('admin') && delegatedScopes.length > 0;

  if (isAdmin || hasDelegatedAdmin || allowedRoles.includes(role)) {
    return <>{children}</>;
  }

  return (
    <Shell hideLeftRail hideRightRail>
      <div className="min-h-[65vh] flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center p-6">
          <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 mx-auto flex items-center justify-center mb-3">
            <Lock className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Administrator Authority Required
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
            This console requires one of the following roles:{' '}
            <span className="font-semibold">{allowedRoles.join(', ')}</span>. Your active session role is{' '}
            <span className="font-semibold capitalize">{role}</span>.
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              onClick={() => navigate('/')}
            >
              Back to Feed
            </Button>
            {isDemoMode && allowedRoles.includes('admin') && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                onClick={() => {
                  switchPersona('usr_admin_alex');
                  toast.success('Switched to Admin Persona: Bilal Sheikh');
                }}
              >
                Switch to Admin (Bilal Sheikh)
              </Button>
            )}
          </div>
        </Card>
      </div>
    </Shell>
  );
};

export const VerifiedRecruiterRoute: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isVerifiedRecruiter, isAdmin, role, isDemoMode, switchPersona } = useAuth();
  const navigate = useNavigate();

  if (isAdmin || isVerifiedRecruiter) {
    return <>{children}</>;
  }

  return (
    <Shell hideLeftRail hideRightRail>
      <div className="min-h-[65vh] flex items-center justify-center p-4">
        <Card className="max-w-lg w-full text-center p-6">
          <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-950/50 text-[#0A66C2] mx-auto flex items-center justify-center mb-3">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
            Verified Recruiter Workspace
          </h2>
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
            {role === 'recruiter'
              ? 'Your SECP / PSEB recruiter verification is pending review by platform administrators. Once approved, you can publish PKR job requisitions and manage applicant pipelines.'
              : 'Access to job publishing, custom screening questions, and applicant Kanban pipelines requires a verified Recruiter account.'}
          </p>
          <div className="flex flex-wrap justify-center gap-2.5">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => navigate('/recruiter/verify')}
            >
              Submit SECP / PSEB Verification
            </Button>
            {isDemoMode && (
              <Button
                variant="primary"
                size="sm"
                leftIcon={<UserCheck className="w-3.5 h-3.5" />}
                onClick={() => {
                  switchPersona('usr_recruiter_sarah');
                  toast.success('Switched to Verified Recruiter: Ayesha Siddiqui');
                }}
              >
                Switch to Recruiter (Ayesha Siddiqui)
              </Button>
            )}
          </div>
        </Card>
      </div>
    </Shell>
  );
};
