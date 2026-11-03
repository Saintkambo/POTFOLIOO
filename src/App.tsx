import React from 'react';
import { useAuth } from './presentation/context/AuthContext';
import { useBook } from './presentation/context/BookContext';
import { WelcomePage } from './presentation/pages/WelcomePage';
import { AppLockScreen } from './presentation/components/organisms/AppLockScreen';
import { OnboardingPage } from './presentation/pages/OnboardingPage';
import { AppShell } from './presentation/components/layout/AppShell';
import { Loader2 } from 'lucide-react';

export const App: React.FC = () => {
  const { isAuthenticated, isAppLocked, isAuthLoading, isDemoMode } = useAuth();
  const { book, isLoading: isBookLoading, error, clearError } = useBook();

  // Show loading indicator only (no words or branding)
  if (isAuthLoading || (isAuthenticated && isBookLoading)) {
    return (
      <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4" role="status" aria-label="Loading">
        <div className="w-14 h-14 rounded-2xl bg-slate-navy text-white border-2 border-blackstone shadow-brutal-lg flex items-center justify-center animate-bounce">
          <Loader2 className="w-7 h-7 animate-spin" />
        </div>
      </div>
    );
  }

  // If in interactive demo mode, display AppShell with demo banner
  if (isDemoMode) {
    return <AppShell />;
  }

  // If not authenticated, render Welcome Page
  if (!isAuthenticated) {
    return <WelcomePage />;
  }

  // If device is locked with 4-digit PIN, render App Lock Screen
  if (isAppLocked) {
    return <AppLockScreen />;
  }

  return (
    <>
      {error && (
        <div className="fixed top-2 left-1/2 -translate-x-1/2 z-50 bg-danger text-white border-2 border-blackstone rounded-control px-4 py-2 text-xs font-extrabold shadow-brutal flex items-center gap-2">
          <span>{error}</span>
          <button
            onClick={clearError}
            className="text-white hover:text-blackstone font-black ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {book ? <AppShell /> : <OnboardingPage />}
    </>
  );
};
