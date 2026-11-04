import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import {
  BookOpen,
  Mail,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Sparkles,
  ArrowLeft,
  Store,
} from 'lucide-react';

type WelcomeView = 'landing' | 'signin' | 'signup' | 'forgot';

interface WelcomePageProps {
  initialView?: WelcomeView;
}

export const WelcomePage: React.FC<WelcomePageProps> = ({ initialView }) => {
  const {
    enterDemoMode,
    signIn,
    signUp,
    signInWithGoogle,
    resetPasswordForEmail,
    updateUserPassword,
  } = useAuth();

  const shouldReduceMotion = useReducedMotion();
  const [view, setView] = useState<WelcomeView>(() => {
    if (initialView && initialView !== ('phone' as any)) return initialView;
    const requested = localStorage.getItem('potfolioo_auth_view');
    if (requested === 'signin' || requested === 'signup' || requested === 'forgot') {
      localStorage.removeItem('potfolioo_auth_view');
      return requested;
    }
    if (localStorage.getItem('potfolioo_had_session') === 'true') {
      return 'signin';
    }
    return 'landing';
  });

  // Sign In state
  const [signInIdentifier, setSignInIdentifier] = useState('');
  const [signInPassword, setSignInPassword] = useState('');
  const [showSignInPassword, setShowSignInPassword] = useState(false);

  // Sign Up state
  const [signUpUsername, setSignUpUsername] = useState('');
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);

  // Forgot Password state
  const [forgotEmail, setForgotEmail] = useState('');
  const [isResetCallback, setIsResetCallback] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const navigateTo = (newView: WelcomeView) => {
    clearMessages();
    setView(newView);
  };

  // Check for reset-password hash callback from Supabase
  useEffect(() => {
    if (window.location.hash.includes('type=recovery') || window.location.hash.includes('reset-password')) {
      setIsResetCallback(true);
      setView('forgot');
    }
  }, []);

  // 1. Submit Sign In
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!signInIdentifier.trim() || !signInPassword) {
      setErrorMessage('Please enter both your username and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signIn(signInIdentifier.trim(), signInPassword);
    } catch (err: any) {
      setErrorMessage(err.message || 'Invalid username or password. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 2. Submit Sign Up
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const cleanUsername = signUpUsername.trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3) {
      setErrorMessage('Username must be at least 3 characters long.');
      return;
    }
    if (!/^[a-z0-9_-]+$/i.test(cleanUsername)) {
      setErrorMessage('Username can only contain letters, numbers, underscores and hyphens.');
      return;
    }

    if (signUpEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signUpEmail.trim())) {
      setErrorMessage('Please enter a valid email address or leave it blank.');
      return;
    }

    if (/^\d{4}$/.test(signUpPassword)) {
      setErrorMessage('A 4-digit code cannot be used as your account password. Please choose a secure password with at least 8 characters.');
      return;
    }
    if (signUpPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (signUpPassword !== signUpConfirmPassword) {
      setErrorMessage('Passwords do not match. Please re-enter.');
      return;
    }
    if (!termsAccepted) {
      setErrorMessage('Please acknowledge the Terms of Service and Privacy Policy.');
      return;
    }

    setIsSubmitting(true);
    try {
      await signUp({
        username: cleanUsername,
        password: signUpPassword,
        email: signUpEmail.trim() || undefined,
        fullName: signUpFullName.trim() || undefined,
      });
      // Session is automatically established and currentUser is populated in AuthContext.
      // App.tsx detects isAuthenticated === true and transitions directly to OnboardingPage ("opening business")!
    } catch (err: any) {
      setErrorMessage(err.message || 'Registration failed. Please check your inputs or choose another username.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 3. Request Password Recovery
  const handleForgotRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!forgotEmail.trim()) {
      setErrorMessage('Please enter your username or email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await resetPasswordForEmail(forgotEmail.trim());
      setSuccessMessage(res.message);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send password recovery link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 7. Update Password (Recovery Callback)
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (newPassword.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }
    if (/^\d{4}$/.test(newPassword)) {
      setErrorMessage('A 4-digit code cannot be used as your account password.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateUserPassword(newPassword);
      setSuccessMessage('Password updated successfully. You can now sign in.');
      setIsResetCallback(false);
      setTimeout(() => setView('signin'), 1500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 8. Google Sign-In
  const handleGoogleSignIn = async () => {
    clearMessages();
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setErrorMessage(err.message || 'Google sign-in was cancelled or failed.');
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center px-4 py-8 selection:bg-electric-sky selection:text-blackstone">
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl space-y-6">
        
        {/* =========================================================================
            HEADER & BRANDING (Persistent across views)
            ========================================================================= */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-slate-navy text-white rounded-2xl border-2 border-blackstone shadow-brutal-lg flex items-center justify-center mx-auto transition-transform hover:scale-105">
            <BookOpen className="w-8 h-8 stroke-[2.2]" />
          </div>
          <div className="inline-block px-3 py-0.5 rounded-full bg-citron-lime text-blackstone border border-blackstone text-[10px] font-black uppercase tracking-wider shadow-brutal-sm">
            Commercial Finance Platform
          </div>
          <h1 className="text-3xl sm:text-4xl font-black font-heading text-blackstone tracking-tight">
            POTFOLIOO
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-text-secondary max-w-md mx-auto">
            Financial clarity, inventory control & cash flow for sole proprietors and SMEs.
          </p>
        </div>

        {/* =========================================================================
            DYNAMIC VIEW PANELS WITH ANIMATION
            ========================================================================= */}
        <AnimatePresence mode="wait">
          
          {/* -----------------------------------------------------------------------
              VIEW 1: WELCOME LANDING SCREEN
              ----------------------------------------------------------------------- */}
          {view === 'landing' && (
            <motion.div
              key="landing"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
              className="space-y-5"
            >
              <Card shadowSize="lg" className="space-y-6 p-6 sm:p-8">
                {/* Heading & Value Proposition */}
                <div className="space-y-2">
                  <h2 className="text-xl sm:text-2xl font-black font-heading text-blackstone tracking-tight">
                    Smart Bookkeeping & Cash Flow for Growing Businesses
                  </h2>
                  <p className="text-xs sm:text-sm text-text-secondary leading-relaxed">
                    Track daily income and sales, control retail inventory with weighted-average costs, manage rental properties with tenant due alerts, and generate instant cash flow reports — completely offline-capable with encrypted cloud backup.
                  </p>
                </div>

                {/* Trust Pillars */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="p-3 bg-surface-muted rounded-control border border-blackstone/20 space-y-1">
                    <div className="w-6 h-6 rounded-tile bg-citron-lime text-blackstone border border-blackstone flex items-center justify-center font-black text-xs">
                      TSh
                    </div>
                    <h3 className="text-xs font-black text-blackstone">TZS Native</h3>
                    <p className="text-[11px] text-text-secondary leading-tight">
                      Whole shilling arithmetic with no decimal drift.
                    </p>
                  </div>

                  <div className="p-3 bg-surface-muted rounded-control border border-blackstone/20 space-y-1">
                    <div className="w-6 h-6 rounded-tile bg-electric-sky text-blackstone border border-blackstone flex items-center justify-center">
                      <Store className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-black text-blackstone">Retail & Rental</h3>
                    <p className="text-[11px] text-text-secondary leading-tight">
                      Stock COGS alerts & overdue tenant reminders.
                    </p>
                  </div>

                  <div className="p-3 bg-surface-muted rounded-control border border-blackstone/20 space-y-1">
                    <div className="w-6 h-6 rounded-tile bg-vivid-amber text-blackstone border border-blackstone flex items-center justify-center">
                      <ShieldCheck className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs font-black text-blackstone">100% Offline</h3>
                    <p className="text-[11px] text-text-secondary leading-tight">
                      Records save locally first, syncing when online.
                    </p>
                  </div>
                </div>

                {/* Primary Actions */}
                <div className="space-y-3 pt-2">
                  <Button
                    variant="primary"
                    size="lg"
                    fullWidth
                    onClick={() => navigateTo('signup')}
                    className="flex items-center justify-center gap-2 text-sm font-black"
                  >
                    <span>Create Account</span>
                    <ArrowRight className="w-4 h-4" />
                  </Button>

                  <Button
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={() => navigateTo('signin')}
                    className="flex items-center justify-center gap-2 text-sm font-black"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>Sign In</span>
                  </Button>

                  {/* Explore Demo Action */}
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={enterDemoMode}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-control bg-citron-lime-tint border border-citron-lime hover:bg-citron-lime/30 text-blackstone text-xs font-extrabold transition-all cursor-pointer shadow-brutal-sm hover:-translate-y-0.5 active:translate-x-0.5 active:translate-y-0.5"
                    >
                      <Sparkles className="w-4 h-4 text-blackstone animate-pulse" />
                      <span>Explore Demo (Try without signing up)</span>
                    </button>
                  </div>
                </div>
              </Card>

              {/* Security Footnote */}
              <div className="flex items-center justify-center gap-2 text-[11px] font-semibold text-text-secondary">
                <ShieldCheck className="w-4 h-4 text-slate-navy" />
                <span>Enterprise Row Level Security • Strict Business Data Isolation</span>
              </div>
            </motion.div>
          )}

          {/* -----------------------------------------------------------------------
              VIEW 2: SIGN IN SCREEN
              ----------------------------------------------------------------------- */}
          {view === 'signin' && (
            <motion.div
              key="signin"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Card shadowSize="lg" className="space-y-5 p-6 sm:p-8">
                {/* Back Link & Header */}
                <div className="flex items-center justify-between pb-1 border-b border-blackstone/10">
                  <button
                    type="button"
                    onClick={() => navigateTo('landing')}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blackstone hover:text-slate-navy cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Overview</span>
                  </button>
                  <span className="text-xs font-bold text-text-secondary">Account Sign In</span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-black font-heading text-blackstone tracking-tight">
                    Welcome back
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Sign in to access your business ledgers and cloud records.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-danger/10 border-2 border-danger text-danger rounded-control text-xs font-bold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSignIn} className="space-y-4">
                  <Input
                    label="Username or Email"
                    type="text"
                    value={signInIdentifier}
                    onChange={(e) => setSignInIdentifier(e.target.value)}
                    placeholder="e.g. baraka_ali or baraka@business.co.tz"
                    required
                    leftIcon={<User className="w-4 h-4" />}
                  />

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80">
                        Password
                      </label>
                      <button
                        type="button"
                        onClick={() => navigateTo('forgot')}
                        className="text-xs font-extrabold text-slate-navy hover:underline cursor-pointer"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        type={showSignInPassword ? 'text' : 'password'}
                        value={signInPassword}
                        onChange={(e) => setSignInPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3.5 py-2.5 rounded-control border-2 border-blackstone bg-surface text-blackstone font-medium text-sm focus:outline-none focus:ring-2 focus:ring-electric-sky pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignInPassword(!showSignInPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-blackstone cursor-pointer"
                      >
                        {showSignInPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isSubmitting}
                    className="text-sm font-black mt-2"
                  >
                    Sign In to Account
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-blackstone/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-surface px-2 text-text-secondary font-black">Or continue with</span>
                  </div>
                </div>

                {/* Alternate Auth Options */}
                <div className="space-y-2.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="md"
                    fullWidth
                    onClick={handleGoogleSignIn}
                    className="flex items-center justify-center gap-2.5 text-xs font-black"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                    </svg>
                    <span>Continue with Google</span>
                  </Button>
                </div>

                {/* Footer Switch */}
                <div className="pt-2 text-center text-xs font-semibold text-text-secondary">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigateTo('signup')}
                    className="font-black text-slate-navy hover:underline cursor-pointer"
                  >
                    Create Account
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* -----------------------------------------------------------------------
              VIEW 3: SIGN UP SCREEN
              ----------------------------------------------------------------------- */}
          {view === 'signup' && (
            <motion.div
              key="signup"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Card shadowSize="lg" className="space-y-5 p-6 sm:p-8">
                {/* Back Link & Header */}
                <div className="flex items-center justify-between pb-1 border-b border-blackstone/10">
                  <button
                    type="button"
                    onClick={() => navigateTo('landing')}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blackstone hover:text-slate-navy cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>
                  <span className="text-xs font-bold text-text-secondary">New Business Profile</span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-black font-heading text-blackstone tracking-tight">
                    Create your account
                  </h2>
                  <p className="text-xs text-text-secondary">
                    Set up your secure username and password to start managing your business.
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-danger/10 border-2 border-danger text-danger rounded-control text-xs font-bold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <form onSubmit={handleSignUp} className="space-y-3.5">
                  <div className="space-y-1">
                    <Input
                      label="Username (Required)"
                      value={signUpUsername}
                      onChange={(e) => setSignUpUsername(e.target.value)}
                      placeholder="e.g. baraka_ali"
                      required
                      leftIcon={<User className="w-4 h-4" />}
                    />
                    <p className="text-[11px] text-text-secondary pl-1">
                      At least 3 characters. Letters, numbers, underscores, and hyphens.
                    </p>
                  </div>

                  <Input
                    label="Full Name (Optional)"
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    placeholder="e.g. Baraka Ali"
                  />

                  <div className="space-y-1">
                    <Input
                      label="Email Address (Optional)"
                      type="email"
                      value={signUpEmail}
                      onChange={(e) => setSignUpEmail(e.target.value)}
                      placeholder="e.g. baraka@business.co.tz"
                      leftIcon={<Mail className="w-4 h-4" />}
                    />
                    <p className="text-[11px] text-text-secondary pl-1">
                      Optional profile info for password recovery. Email verification is not required.
                    </p>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80">
                      Password (min 8 characters)
                    </label>
                    <div className="relative">
                      <input
                        type={showSignUpPassword ? 'text' : 'password'}
                        value={signUpPassword}
                        onChange={(e) => setSignUpPassword(e.target.value)}
                        placeholder="Choose a strong password"
                        required
                        className="w-full px-3.5 py-2.5 rounded-control border-2 border-blackstone bg-surface text-blackstone font-medium text-sm focus:outline-none focus:ring-2 focus:ring-electric-sky pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary hover:text-blackstone cursor-pointer"
                      >
                        {showSignUpPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80">
                      Confirm Password
                    </label>
                    <input
                      type={showSignUpPassword ? 'text' : 'password'}
                      value={signUpConfirmPassword}
                      onChange={(e) => setSignUpConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      required
                      className="w-full px-3.5 py-2.5 rounded-control border-2 border-blackstone bg-surface text-blackstone font-medium text-sm focus:outline-none focus:ring-2 focus:ring-electric-sky"
                    />
                  </div>

                  {/* Terms & Conditions Acknowledgement */}
                  <label className="flex items-start gap-2.5 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={termsAccepted}
                      onChange={(e) => setTermsAccepted(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-2 border-blackstone text-slate-navy focus:ring-electric-sky"
                    />
                    <span className="text-[11px] font-semibold text-text-secondary leading-snug">
                      I acknowledge the Terms of Service & Privacy Policy for business financial records and data confidentiality.
                    </span>
                  </label>

                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    loading={isSubmitting}
                    className="text-sm font-black mt-2"
                  >
                    Create Account
                  </Button>
                </form>

                {/* Divider */}
                <div className="relative my-3">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-blackstone/20" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-surface px-2 text-text-secondary font-black">Or sign up with</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="secondary"
                  size="md"
                  fullWidth
                  onClick={handleGoogleSignIn}
                  className="flex items-center justify-center gap-2.5 text-xs font-black"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span>Sign Up with Google</span>
                </Button>

                {/* Footer Switch */}
                <div className="pt-2 text-center text-xs font-semibold text-text-secondary">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigateTo('signin')}
                    className="font-black text-slate-navy hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* -----------------------------------------------------------------------
              VIEW 6: FORGOT PASSWORD & RECOVERY SCREEN
              ----------------------------------------------------------------------- */}
          {view === 'forgot' && (
            <motion.div
              key="forgot"
              initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -14 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <Card shadowSize="lg" className="space-y-5 p-6 sm:p-8">
                {/* Back Link & Header */}
                <div className="flex items-center justify-between pb-1 border-b border-blackstone/10">
                  <button
                    type="button"
                    onClick={() => navigateTo('signin')}
                    className="inline-flex items-center gap-1.5 text-xs font-extrabold text-blackstone hover:text-slate-navy cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Sign In</span>
                  </button>
                  <span className="text-xs font-bold text-text-secondary">Password Recovery</span>
                </div>

                <div className="space-y-1">
                  <h2 className="text-xl font-black font-heading text-blackstone tracking-tight">
                    {isResetCallback ? 'Set New Password' : 'Reset your password'}
                  </h2>
                  <p className="text-xs text-text-secondary">
                    {isResetCallback
                      ? 'Choose a new password for your business profile.'
                      : "Enter your registered email address and we'll send a secure password reset link."}
                  </p>
                </div>

                {errorMessage && (
                  <div className="p-3 bg-danger/10 border-2 border-danger text-danger rounded-control text-xs font-bold flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {successMessage && (
                  <div className="p-3 bg-success/10 border-2 border-success text-success rounded-control text-xs font-bold flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{successMessage}</span>
                  </div>
                )}

                {isResetCallback ? (
                  <form onSubmit={handleUpdatePassword} className="space-y-4">
                    <div className="space-y-1">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80">
                        New Password (min 8 characters)
                      </label>
                      <input
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3.5 py-2.5 rounded-control border-2 border-blackstone bg-surface text-blackstone font-medium text-sm focus:outline-none focus:ring-2 focus:ring-electric-sky"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        value={confirmNewPassword}
                        onChange={(e) => setConfirmNewPassword(e.target.value)}
                        placeholder="••••••••"
                        required
                        className="w-full px-3.5 py-2.5 rounded-control border-2 border-blackstone bg-surface text-blackstone font-medium text-sm focus:outline-none focus:ring-2 focus:ring-electric-sky"
                      />
                    </div>

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      loading={isSubmitting}
                      className="text-sm font-black mt-2"
                    >
                      Update Password
                    </Button>
                  </form>
                ) : (
                  <form onSubmit={handleForgotRequest} className="space-y-4">
                    <Input
                      label="Registered Email Address"
                      type="email"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      placeholder="e.g. baraka@business.co.tz"
                      required
                      leftIcon={<Mail className="w-4 h-4" />}
                    />

                    <Button
                      type="submit"
                      variant="primary"
                      size="lg"
                      fullWidth
                      loading={isSubmitting}
                      className="text-sm font-black mt-2"
                    >
                      Send Password Reset Link
                    </Button>
                  </form>
                )}
              </Card>
            </motion.div>
          )}

        </AnimatePresence>

      </div>
    </div>
  );
};
