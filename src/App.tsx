import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { ThemeProvider } from './lib/theme/ThemeContext';
import { NextStepAuthProvider, useAuth } from './lib/clerk/AuthProvider';
import { HomePage } from './pages/HomePage';
import { NetworkPage } from './pages/NetworkPage';
import { JobsPage } from './pages/JobsPage';
import { MessagingPage } from './pages/MessagingPage';
import { NotificationsPage } from './pages/NotificationsPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { RecruiterPage } from './pages/RecruiterPage';
import { RecruiterVerifyPage } from './pages/RecruiterVerifyPage';
import { ResumeBuilderPage } from './pages/ResumeBuilderPage';
import { SettingsPage } from './pages/SettingsPage';
import { SearchPage } from './pages/SearchPage';
import { CompanyPage } from './pages/CompanyPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { OnboardingModal } from './features/auth/OnboardingModal';
import { AuthModal } from './features/auth/AuthModal';
import { GeminiChatWidget } from './components/chat/GeminiChatWidget';
import { MiniChatDock } from './features/messaging/MiniChatDock';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
    },
  },
});

const AppContent: React.FC = () => {
  const { needsOnboarding } = useAuth();
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/network" element={<NetworkPage />} />
        <Route path="/mynetwork" element={<Navigate to="/network" replace />} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route path="/messaging" element={<MessagingPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/company/:slug" element={<CompanyPage />} />
        <Route path="/companies/:slug" element={<CompanyPage />} />
        <Route path="/in/:handle" element={<ProfilePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/admin/:section" element={<AdminPage />} />
        <Route path="/recruiter" element={<RecruiterPage />} />
        <Route path="/recruiter/verify" element={<RecruiterVerifyPage />} />
        <Route path="/recruiter/:section" element={<RecruiterPage />} />
        <Route path="/resume-builder" element={<ResumeBuilderPage />} />
        <Route path="/resume" element={<Navigate to="/resume-builder" replace />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/sign-in" element={<Navigate to="/" replace />} />
        <Route path="/sign-up" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      {/* Onboarding Wizard Modal */}
      {(needsOnboarding || isOnboardingOpen) && (
        <OnboardingModal
          isOpen={needsOnboarding || isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
        />
      )}

      {/* Sign In / Sign Up Modal */}
      {isAuthOpen && (
        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
        />
      )}

      {/* Floating LinkedIn-style 1:1 Mini-Chat Dock */}
      <MiniChatDock />

      {/* NextStep AI Assistant Floating Drawer */}
      <GeminiChatWidget />

      <Toaster position="top-right" richColors />
    </>
  );
};

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <NextStepAuthProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </NextStepAuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
