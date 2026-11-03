import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Lock, KeyRound, LogOut, AlertTriangle, ShieldAlert, ArrowLeft } from 'lucide-react';

export const AppLockScreen: React.FC = () => {
  const { currentUser, verifyPin, unlockWithPassword, logout, pinState } = useAuth();
  const [pin, setPin] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [showPasswordRecovery, setShowPasswordRecovery] = useState<boolean>(false);
  const [accountPassword, setAccountPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isUnlockingPassword, setIsUnlockingPassword] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(0);

  // Live countdown timer for lockout
  useEffect(() => {
    if (pinState.lockedUntil && pinState.lockedUntil > Date.now()) {
      const updateTimer = () => {
        const remaining = Math.max(0, Math.ceil((pinState.lockedUntil! - Date.now()) / 1000));
        setCountdown(remaining);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setCountdown(0);
    }
  }, [pinState.lockedUntil]);

  const handleDigitPress = useCallback(
    async (digit: string) => {
      if (countdown > 0 || isVerifying) return;
      if (pin.length >= 4) return;

      const nextPin = pin + digit;
      setPin(nextPin);
      setErrorNotice(null);

      if (nextPin.length === 4) {
        setIsVerifying(true);
        try {
          const res = await verifyPin(nextPin);
          if (!res.success) {
            setPin('');
            if (res.lockedForSeconds && res.lockedForSeconds > 0) {
              setErrorNotice(`Maximum attempts reached. Locked for ${res.lockedForSeconds} seconds.`);
            } else if (res.remainingAttempts !== undefined) {
              setErrorNotice(`Incorrect PIN. ${res.remainingAttempts} attempt(s) remaining.`);
            } else {
              setErrorNotice('Incorrect PIN. Please try again.');
            }
          }
        } finally {
          setIsVerifying(false);
        }
      }
    },
    [pin, countdown, isVerifying, verifyPin]
  );

  const handleBackspace = useCallback(() => {
    if (countdown > 0 || isVerifying) return;
    setPin((prev) => prev.slice(0, -1));
    setErrorNotice(null);
  }, [countdown, isVerifying]);

  const handleClear = useCallback(() => {
    if (countdown > 0 || isVerifying) return;
    setPin('');
    setErrorNotice(null);
  }, [countdown, isVerifying]);

  // Handle keyboard typing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (showPasswordRecovery) return;
      if (/^[0-9]$/.test(e.key)) {
        handleDigitPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        handleClear();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigitPress, handleBackspace, handleClear, showPasswordRecovery]);

  const handlePasswordUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountPassword.trim()) return;

    setIsUnlockingPassword(true);
    setPasswordError(null);
    try {
      const success = await unlockWithPassword(accountPassword);
      if (!success) {
        setPasswordError('Incorrect account password. Please try again.');
      } else {
        setShowPasswordRecovery(false);
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Failed to verify password.');
    } finally {
      setIsUnlockingPassword(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <Card shadowSize="lg" className="w-full max-w-sm p-6 space-y-6 text-center border-2 border-blackstone bg-surface">
        {/* App Lock Header */}
        <div className="space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-slate-navy text-white border-2 border-blackstone shadow-brutal flex items-center justify-center mx-auto">
            {countdown > 0 ? (
              <ShieldAlert className="w-7 h-7 text-danger animate-pulse" />
            ) : (
              <Lock className="w-7 h-7 text-citron-lime stroke-[2.2]" />
            )}
          </div>
          <h1 className="text-xl font-black font-heading text-blackstone tracking-tight">
            POTFOLIOO App Lock
          </h1>
          <p className="text-xs text-text-secondary font-medium">
            {countdown > 0 ? (
              <span className="text-danger font-extrabold">Device locked for security</span>
            ) : (
              `Welcome back, ${currentUser?.username || 'user'}. Enter your 4-digit PIN.`
            )}
          </p>
        </div>

        {/* Password Recovery Modal / View */}
        {showPasswordRecovery ? (
          <form onSubmit={handlePasswordUnlock} className="space-y-4 text-left pt-2 border-t border-blackstone/10">
            <div className="text-xs space-y-1">
              <span className="font-extrabold text-blackstone">Unlock with Account Password</span>
              <p className="text-[11px] text-text-secondary">
                Enter your cloud account password to bypass the PIN and unlock your device.
              </p>
            </div>

            <input
              type="password"
              value={accountPassword}
              onChange={(e) => setAccountPassword(e.target.value)}
              placeholder="Enter your account password"
              className="w-full h-11 px-3 bg-canvas text-blackstone text-sm font-semibold rounded-control border-2 border-blackstone outline-none focus:ring-2 focus:ring-accent-purple"
              required
              autoFocus
            />

            {passwordError && (
              <div className="p-2.5 rounded bg-rose-50 border border-danger text-xs font-bold text-danger flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{passwordError}</span>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setShowPasswordRecovery(false);
                  setPasswordError(null);
                  setAccountPassword('');
                }}
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" />
                Back to PIN
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                className="flex-1 bg-citron-lime text-blackstone font-black"
                disabled={isUnlockingPassword}
              >
                {isUnlockingPassword ? 'Verifying...' : 'Unlock'}
              </Button>
            </div>
          </form>
        ) : (
          <>
            {/* 4 PIN Dots */}
            <div className="flex items-center justify-center gap-4 py-2">
              {[0, 1, 2, 3].map((index) => {
                const isFilled = index < pin.length;
                return (
                  <div
                    key={index}
                    className={`w-4 h-4 rounded-full border-2 border-blackstone transition-all duration-150 ${
                      isFilled
                        ? 'bg-accent-purple scale-110 shadow-xs'
                        : 'bg-canvas'
                    }`}
                  />
                );
              })}
            </div>

            {/* Error or Lockout Notice */}
            {countdown > 0 ? (
              <div className="p-3 bg-rose-50 border-2 border-danger rounded-control text-xs font-extrabold text-danger flex items-center justify-center gap-2 animate-pulse">
                <AlertTriangle className="w-4 h-4 shrink-0 text-danger" />
                <span>Too many attempts. Retry in {countdown}s</span>
              </div>
            ) : errorNotice ? (
              <div className="p-2.5 bg-rose-50 border-2 border-danger rounded-control text-xs font-bold text-danger flex items-center justify-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>{errorNotice}</span>
              </div>
            ) : (
              <p className="text-[11px] font-bold text-text-secondary h-5">
                {isVerifying ? 'Verifying PIN...' : 'Tap digits or use keyboard'}
              </p>
            )}

            {/* 3x4 Number Keypad */}
            <div className="grid grid-cols-3 gap-2.5 pt-1 max-w-[260px] mx-auto">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                <button
                  key={digit}
                  type="button"
                  disabled={countdown > 0 || isVerifying}
                  onClick={() => handleDigitPress(digit)}
                  className="h-12 rounded-control bg-canvas hover:bg-surface border-2 border-blackstone font-mono font-black text-lg text-blackstone shadow-brutal-sm cursor-pointer neo-press active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {digit}
                </button>
              ))}
              <button
                type="button"
                disabled={countdown > 0 || isVerifying || pin.length === 0}
                onClick={handleClear}
                className="h-12 rounded-control bg-canvas hover:bg-surface border-2 border-blackstone font-bold text-xs text-text-secondary shadow-brutal-sm cursor-pointer neo-press disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Clear
              </button>
              <button
                type="button"
                disabled={countdown > 0 || isVerifying}
                onClick={() => handleDigitPress('0')}
                className="h-12 rounded-control bg-canvas hover:bg-surface border-2 border-blackstone font-mono font-black text-lg text-blackstone shadow-brutal-sm cursor-pointer neo-press active:translate-x-0.5 active:translate-y-0.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                0
              </button>
              <button
                type="button"
                disabled={countdown > 0 || isVerifying || pin.length === 0}
                onClick={handleBackspace}
                className="h-12 rounded-control bg-canvas hover:bg-surface border-2 border-blackstone font-bold text-xs text-blackstone shadow-brutal-sm cursor-pointer neo-press disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label="Backspace"
              >
                ⌫
              </button>
            </div>

            {/* Safe Recovery Options */}
            <div className="pt-3 border-t border-blackstone/10 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setShowPasswordRecovery(true)}
                className="text-xs font-black text-accent-purple hover:underline cursor-pointer flex items-center justify-center gap-1.5 py-1"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Forgot PIN? Unlock with Password</span>
              </button>

              <button
                type="button"
                onClick={logout}
                className="text-xs font-bold text-text-secondary hover:text-danger cursor-pointer flex items-center justify-center gap-1.5 py-1"
              >
                <LogOut className="w-3 h-3" />
                <span>Switch Account / Sign Out</span>
              </button>
            </div>
          </>
        )}
      </Card>
    </div>
  );
};
