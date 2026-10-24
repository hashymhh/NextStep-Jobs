import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Modal } from '../../components/ui/Modal';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useAuth } from '../../lib/clerk/useAuth';
import { UserCheck, Briefcase, ShieldCheck, Mail, Lock, User } from 'lucide-react';

const authSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

type AuthFormData = z.infer<typeof authSchema>;

export const AuthModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'signin' | 'signup';
}> = ({ isOpen, onClose, initialMode = 'signin' }) => {
  const [mode, setMode] = useState<'signin' | 'signup'>(initialMode);
  const { switchPersona, isDemoMode } = useAuth();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: 'hamza.tariq@nextstep.pk',
      password: 'password123',
    },
  });

  const onSubmit = () => {
    // In demo mode, sign in as candidate or create demo profile
    switchPersona('usr_candidate_john');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === 'signin' ? 'Sign in to NextStep' : 'Join NextStep today'}
      description="Stay updated on your professional world"
      maxWidth="sm"
    >
      <div className="space-y-4">
        {/* Quick Demo Switcher if in Demo Mode */}
        {isDemoMode && (
          <div className="p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-900/50">
            <p className="text-[11px] font-bold text-[#0A66C2] dark:text-[#71B7FB] uppercase tracking-wider mb-2">
              Instant Demo Sign In
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              <Button
                variant="secondary"
                size="sm"
                className="justify-start text-xs h-8"
                leftIcon={<UserCheck className="w-3.5 h-3.5 text-blue-600" />}
                onClick={() => {
                  switchPersona('usr_candidate_john');
                  onClose();
                }}
              >
                Sign in as Candidate (Hamza Tariq)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="justify-start text-xs h-8"
                leftIcon={<Briefcase className="w-3.5 h-3.5 text-purple-600" />}
                onClick={() => {
                  switchPersona('usr_recruiter_sarah');
                  onClose();
                }}
              >
                Sign in as Recruiter (Ayesha Siddiqui)
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="justify-start text-xs h-8"
                leftIcon={<ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />}
                onClick={() => {
                  switchPersona('usr_admin_alex');
                  onClose();
                }}
              >
                Sign in as Admin (Bilal Sheikh)
              </Button>
            </div>
          </div>
        )}

        {/* Google OAuth Button */}
        <Button
          variant="secondary"
          className="w-full flex items-center justify-center gap-2 border-gray-300 dark:border-gray-700"
          onClick={() => {
            switchPersona('usr_candidate_john');
            onClose();
          }}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
            />
          </svg>
          Continue with Google
        </Button>

        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-gray-200 dark:border-gray-800" />
          <span className="flex-shrink mx-3 text-xs text-gray-400">or</span>
          <div className="flex-grow border-t border-gray-200 dark:border-gray-800" />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          {mode === 'signup' && (
            <div className="grid grid-cols-2 gap-2">
              <Input
                label="First Name"
                placeholder="Hamza"
                leftIcon={<User className="w-3.5 h-3.5" />}
                {...register('firstName')}
              />
              <Input
                label="Last Name"
                placeholder="Tariq"
                {...register('lastName')}
              />
            </div>
          )}

          <Input
            label="Email"
            type="email"
            placeholder="you@nextstep.pk"
            leftIcon={<Mail className="w-3.5 h-3.5" />}
            {...register('email')}
            error={errors.email?.message}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock className="w-3.5 h-3.5" />}
            {...register('password')}
            error={errors.password?.message}
          />

          <Button type="submit" className="w-full mt-2">
            {mode === 'signin' ? 'Sign In' : 'Agree & Join'}
          </Button>
        </form>

        <div className="text-center text-xs pt-2">
          {mode === 'signin' ? (
            <p className="text-gray-500">
              New to NextStep?{' '}
              <button
                type="button"
                onClick={() => setMode('signup')}
                className="font-bold text-[#0A66C2] hover:underline cursor-pointer"
              >
                Join now
              </button>
            </p>
          ) : (
            <p className="text-gray-500">
              Already on NextStep?{' '}
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="font-bold text-[#0A66C2] hover:underline cursor-pointer"
              >
                Sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </Modal>
  );
};
