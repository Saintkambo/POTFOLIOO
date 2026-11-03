import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useBook } from '../context/BookContext';
import { SUPPORTED_CURRENCIES } from '../../domain/money';
import { BusinessCategory } from '../../domain/models/book';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Download,
  Upload,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Database,
  Cloud,
  CloudOff,
  RefreshCw,
  CheckCircle2,
  Home,
  Briefcase,
  ShoppingBag,
  Plus,
  Trash2,
  Sun,
  Moon,
  Lock,
  Unlock,
  KeyRound,
  LogOut,
} from 'lucide-react';
import { BackupValidationResult } from '../../application/ports/backup-port';
import { AddBusinessModal } from '../components/organisms/AddBusinessModal';
import { useTheme } from '../context/ThemeContext';
import { usePwaInstall } from '../hooks/usePwaInstall';

interface SettingsPageProps {
  onOpenRestoreModal: (result: BackupValidationResult, rawContent: string) => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onOpenRestoreModal }) => {
  const { isInstallable, isInstalled, promptInstall } = usePwaInstall();
  const {
    book,
    books,
    switchBook,
    createBusiness,
    deleteBusiness,
    renameBook,
    updateCurrency,
    updateCategory,
    lowStockThreshold,
    updateLowStockThreshold,
    downloadBackup,
    inspectBackup,
    downloadCSV,
    downloadExcel,
    downloadPDF,
    resetBusinessData,
    restartOnboarding,
    isStoragePersisted,
    cloudSyncStatus,
    lastSyncTime,
    isCloudConfigured,
    triggerCloudSync,
  } = useBook();

  const { theme, setTheme } = useTheme();
  const { currentUser, pinState, setPin, removePin, logout } = useAuth();

  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSettingPin, setIsSettingPin] = useState(false);
  const [newPinInput, setNewPinInput] = useState('');
  const [pinFeedback, setPinFeedback] = useState<string | null>(null);
  const [pinError, setPinError] = useState<string | null>(null);

  const [bookName, setBookName] = useState(book?.name || '');
  const [currency, setCurrency] = useState(book?.currencyCode && book.currencyCode !== 'USD' ? book.currencyCode : 'TZS');
  const [category, setCategory] = useState<BusinessCategory>(book?.category || 'other');
  const [thresholdInput, setThresholdInput] = useState<string>(String(lowStockThreshold || 10));
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<string | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (book) {
      setBookName(book.name);
      setCurrency(book.currencyCode && book.currencyCode !== 'USD' ? book.currencyCode : 'TZS');
      setCategory(book.category || 'other');
      setThresholdInput(String(book.lowStockThreshold ?? 10));
    }
  }, [book]);

  const handleSaveBookDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;

    if (bookName.trim() && bookName !== book.name) {
      await renameBook(bookName.trim());
    }

    if (category !== book.category) {
      await updateCategory(category);
    }

    if (currency !== book.currencyCode) {
      await updateCurrency(currency);
    }

    if (category === 'retail') {
      const parsed = parseInt(thresholdInput, 10);
      const validThreshold = !isNaN(parsed) && parsed >= 1 ? parsed : 10;
      if (validThreshold !== (book.lowStockThreshold ?? 10)) {
        await updateLowStockThreshold(validThreshold);
      }
    }

    setSaveMessage('Business details updated successfully.');
    setTimeout(() => setSaveMessage(null), 3000);
  };

  const handleSyncWithSupabase = async () => {
    setSyncFeedback(null);
    const result = await triggerCloudSync();
    if (result && result.success) {
      setSyncFeedback(`Successfully synced! Pushed: ${result.pushedTransactions}, Pulled: ${result.pulledTransactions}`);
    } else {
      setSyncFeedback('Sync failed or offline. Local records remain safe.');
    }
    setTimeout(() => setSyncFeedback(null), 5000);
  };

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        const validation = inspectBackup(content);
        onOpenRestoreModal(validation, content);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);
    setPinFeedback(null);
    if (!/^\d{4}$/.test(newPinInput)) {
      setPinError('PIN must be exactly 4 numeric digits.');
      return;
    }
    try {
      await setPin(newPinInput);
      setNewPinInput('');
      setIsSettingPin(false);
      setPinFeedback('Device app-lock PIN activated successfully.');
      setTimeout(() => setPinFeedback(null), 3500);
    } catch (err: any) {
      setPinError(err.message || 'Failed to update PIN.');
    }
  };

  const handleRemovePin = async () => {
    if (confirm('Are you sure you want to disable the device PIN lock?')) {
      try {
        await removePin();
        setPinFeedback('Device app-lock PIN disabled.');
        setTimeout(() => setPinFeedback(null), 3500);
      } catch (err: any) {
        setPinError(err.message || 'Failed to remove PIN.');
      }
    }
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await logout();
    } catch (e) {
      console.warn('Sign out failed:', e);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* 0. Authenticated User Profile & Cloud Account Card */}
      {currentUser && (
        <Card shadowSize="sm" className="bg-surface border-2 border-blackstone p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-blackstone/10 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full bg-accent-purple text-white border border-blackstone flex items-center justify-center font-black text-xs">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-blackstone font-heading">
                  User Profile & Cloud Account
                </h3>
                <p className="text-[11px] font-bold text-text-secondary">
                  Logged in as <strong className="text-blackstone">@{currentUser.username}</strong>
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={isSigningOut}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-canvas hover:bg-rose-50 border-2 border-blackstone text-xs font-black text-danger shadow-xs cursor-pointer neo-press transition-all disabled:opacity-50"
              title="Sign out of POTFOLIOO"
            >
              <LogOut className={`w-3.5 h-3.5 ${isSigningOut ? 'animate-spin' : ''}`} />
              <span>{isSigningOut ? 'Signing Out...' : 'Sign Out'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 bg-canvas rounded-control border border-blackstone/20">
              <span className="text-[10px] font-extrabold uppercase text-text-secondary block">
                Verified Contact
              </span>
              <span className="font-extrabold text-blackstone truncate block">
                {currentUser.email || currentUser.phone || 'Local Account'}
              </span>
            </div>

            <div className="p-2.5 bg-canvas rounded-control border border-blackstone/20">
              <span className="text-[10px] font-extrabold uppercase text-text-secondary block">
                Cloud Isolation & Provider
              </span>
              <span className="font-extrabold text-blackstone uppercase block">
                {currentUser.provider} • Isolated
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* 0.1 Optional Device-Level 4-Digit App Lock PIN Card */}
      {currentUser && (
        <Card shadowSize="sm" className="bg-surface border-2 border-blackstone p-3.5 space-y-3">
          <div className="flex items-center justify-between border-b border-blackstone/10 pb-2">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-accent-purple/20 border border-blackstone flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-accent-purple" />
              </div>
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-blackstone font-heading">
                  Device App Lock (Optional 4-Digit PIN)
                </h3>
                <p className="text-[11px] text-text-secondary">
                  Lock POTFOLIOO on this device with a quick numeric PIN.
                </p>
              </div>
            </div>

            <span
              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded border border-blackstone ${
                pinState.enabled ? 'bg-citron-lime text-blackstone' : 'bg-canvas text-text-secondary'
              }`}
            >
              {pinState.enabled ? 'PIN Active' : 'Disabled'}
            </span>
          </div>

          {pinFeedback && (
            <div className="p-2.5 bg-citron-lime-tint border border-citron-lime rounded-control text-xs font-extrabold text-blackstone">
              ✓ {pinFeedback}
            </div>
          )}

          {pinError && (
            <div className="p-2.5 bg-rose-50 border border-danger rounded-control text-xs font-bold text-danger">
              ⚠️ {pinError}
            </div>
          )}

          {isSettingPin ? (
            <form onSubmit={handleSavePin} className="space-y-3 pt-1">
              <div className="space-y-1">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80">
                  Enter 4-Digit PIN
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="password"
                    maxLength={4}
                    value={newPinInput}
                    onChange={(e) => setNewPinInput(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-32 h-11 px-3 bg-canvas text-blackstone font-mono font-black text-center text-lg tracking-widest rounded-control border-2 border-blackstone outline-none focus:ring-2 focus:ring-accent-purple"
                    required
                    autoFocus
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    className="bg-citron-lime text-blackstone font-black"
                  >
                    Save PIN
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setIsSettingPin(false);
                      setNewPinInput('');
                      setPinError(null);
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
              <p className="text-[11px] text-text-secondary">
                PIN is hashed using PBKDF2/SHA-256 with salt. It functions as a device app lock and is never used as your cloud password.
              </p>
            </form>
          ) : (
            <div className="flex items-center gap-2 pt-1">
              <Button
                variant={pinState.enabled ? 'outline' : 'primary'}
                size="sm"
                className={`text-xs font-black ${!pinState.enabled ? 'bg-citron-lime text-blackstone' : ''}`}
                onClick={() => setIsSettingPin(true)}
              >
                <KeyRound className="w-3.5 h-3.5 mr-1" />
                {pinState.enabled ? 'Change 4-Digit PIN' : 'Enable 4-Digit PIN'}
              </Button>

              {pinState.enabled && (
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs text-danger hover:border-danger"
                  onClick={handleRemovePin}
                >
                  <Unlock className="w-3.5 h-3.5 mr-1" />
                  Disable PIN
                </Button>
              )}
            </div>
          )}
        </Card>
      )}

      {/* Storage & Sync Status Card (Exclusive to Settings) */}
      <Card shadowSize="sm" className="bg-surface border-2 border-blackstone p-3.5 space-y-2.5">
        <div className="flex items-center justify-between border-b border-blackstone/10 pb-2">
          <div className="flex items-center gap-2">
            <Database className="w-3.5 h-3.5 text-slate-navy" />
            <h3 className="text-xs font-black uppercase tracking-wider text-blackstone font-heading">
              Storage & Sync Status
            </h3>
          </div>
          <span className="text-[10px] font-bold text-text-secondary uppercase">
            Active System State
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          {/* Local Storage Indicator */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-control bg-canvas border border-blackstone text-xs font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-blackstone">
              {isStoragePersisted ? 'Local Storage (Durable)' : 'Local Storage • Offline Ready'}
            </span>
          </div>

          {/* Supabase Sync Indicator & Action */}
          {isCloudConfigured ? (
            <button
              onClick={handleSyncWithSupabase}
              disabled={cloudSyncStatus === 'syncing'}
              title="Click to sync with Supabase cloud"
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-control text-xs font-extrabold border-2 border-blackstone bg-surface hover:bg-canvas transition-all cursor-pointer shadow-xs active:translate-x-0.5 active:translate-y-0.5"
            >
              {cloudSyncStatus === 'syncing' ? (
                <>
                  <RefreshCw className="w-3 h-3 text-electric-sky animate-spin" />
                  <span>Syncing...</span>
                </>
              ) : cloudSyncStatus === 'synced' ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Supabase Synced</span>
                </>
              ) : cloudSyncStatus === 'offline' ? (
                <>
                  <CloudOff className="w-3.5 h-3.5 text-text-secondary" />
                  <span>Cloud Offline</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3.5 h-3.5 text-vivid-amber" />
                  <span>Sync Cloud</span>
                </>
              )}
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-control bg-canvas border border-blackstone text-xs font-medium text-text-secondary">
              Local Only (Cloud Not Configured)
            </span>
          )}
        </div>
      </Card>

      {/* Appearance & Theme Toggle Card */}
      <Card shadowSize="sm" className="bg-surface border-2 border-blackstone p-3.5 space-y-3">
        <div className="flex items-center justify-between border-b border-blackstone/10 pb-2">
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-blackstone font-heading flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-blackstone" />
              <span>Appearance</span>
            </h3>
            <p className="text-xs text-text-secondary mt-0.5">
              Switch between Light Mode and Dark Mode. Selection is saved automatically.
            </p>
          </div>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-[#A678B9] border border-blackstone text-white shadow-xs">
            {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            onClick={() => setTheme('light')}
            className={`p-3 rounded-control border-2 flex items-center justify-center gap-2 font-black text-xs transition-all cursor-pointer ${
              theme === 'light'
                ? 'bg-surface text-blackstone border-2 border-blackstone shadow-[3px_3px_0px_#A678B9] translate-x-[-1px] translate-y-[-1px] ring-1 ring-[#A678B9]'
                : 'bg-surface text-text-secondary border-blackstone/30 hover:border-blackstone hover:text-blackstone'
            }`}
          >
            <Sun className="w-4 h-4 text-blackstone" />
            <span>Light Mode</span>
          </button>

          <button
            type="button"
            onClick={() => setTheme('dark')}
            className={`p-3 rounded-control border-2 flex items-center justify-center gap-2 font-black text-xs transition-all cursor-pointer ${
              theme === 'dark'
                ? 'bg-surface text-blackstone border-2 border-blackstone shadow-[3px_3px_0px_#A678B9] translate-x-[-1px] translate-y-[-1px] ring-1 ring-[#A678B9]'
                : 'bg-surface text-text-secondary border-blackstone/30 hover:border-blackstone hover:text-blackstone'
            }`}
          >
            <Moon className="w-4 h-4 text-blackstone" />
            <span>Dark Mode</span>
          </button>
        </div>
      </Card>

      {/* PWA App Download / Installation Card (Android & PC) */}
      <Card shadowSize="lg" className="space-y-3.5 border-2 border-blackstone bg-citron-lime-tint">
        <div className="flex items-center justify-between border-b border-blackstone/10 pb-2">
          <div>
            <h2 className="text-sm font-bold font-heading text-blackstone uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-blackstone stroke-[2.2]" />
              <span>Install POTFOLIOO App</span>
            </h2>
            <p className="text-xs text-blackstone/80 mt-0.5">
              Download and install directly to your Android phone, tablet, or Windows PC.
            </p>
          </div>
          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-citron-lime border border-blackstone text-blackstone">
            {isInstalled ? 'Installed' : 'Download Ready'}
          </span>
        </div>

        <div className="space-y-2">
          {isInstalled ? (
            <div className="p-3 bg-surface border-2 border-blackstone rounded-control text-xs font-extrabold text-blackstone flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>POTFOLIOO is installed as a standalone application on this device.</span>
            </div>
          ) : (
            <div className="space-y-2">
              <Button
                type="button"
                variant="primary"
                size="md"
                className="w-full justify-center gap-2 bg-slate-navy text-white hover:bg-slate-navy-dark shadow-brutal"
                onClick={async () => {
                  const success = await promptInstall();
                  if (!success && !isInstallable) {
                    alert('To install on Android: tap Chrome\'s menu (⋮) and select "Install app" or "Add to Home screen". On PC: click the install icon (⊕) in the browser address bar.');
                  }
                }}
              >
                <Download className="w-4 h-4" />
                <span>Install on Android / PC</span>
              </Button>
              <p className="text-[11px] text-text-secondary leading-snug">
                Runs full-screen with offline caching, fast desktop/mobile shortcut, and zero browser borders.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* 1. All Businesses Management Card */}
      <Card shadowSize="lg" className="space-y-3.5">
        <div className="flex items-center justify-between border-b border-blackstone/10 pb-2">
          <div>
            <h2 className="text-sm font-bold font-heading text-blackstone uppercase tracking-wider">
              Manage Businesses ({books.length})
            </h2>
            <p className="text-xs text-text-secondary">
              Switch or create multiple business ledgers.
            </p>
          </div>
          <Button
            size="sm"
            variant="primary"
            className="gap-1 bg-citron-lime text-blackstone border-2 border-blackstone text-xs"
            onClick={() => setIsAddModalOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Business</span>
          </Button>
        </div>

        <div className="space-y-2">
          {books.map((b) => {
            const isActive = b.id === book?.id;
            const isRental = b.category === 'rental';
            const isRetail = b.category === 'retail';

            return (
              <div
                key={b.id}
                className={`p-3 rounded-control border-2 border-blackstone flex items-center justify-between gap-2 transition-all ${
                  isActive ? 'bg-surface shadow-[3px_3px_0px_#A678B9] border-blackstone' : 'bg-canvas/50 hover:bg-surface'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded border border-blackstone flex items-center justify-center shrink-0 ${
                      isRetail
                        ? 'bg-citron-lime text-blackstone'
                        : isRental
                        ? 'bg-vivid-amber text-blackstone'
                        : 'bg-electric-sky text-blackstone'
                    }`}
                  >
                    {isRetail ? (
                      <ShoppingBag className="w-3.5 h-3.5" />
                    ) : isRental ? (
                      <Home className="w-3.5 h-3.5" />
                    ) : (
                      <Briefcase className="w-3.5 h-3.5" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="font-extrabold text-sm text-blackstone truncate">{b.name}</p>
                    <span className="text-[10px] uppercase font-bold text-text-secondary">
                      {isRetail
                        ? '🛍️ Retail / Wholesale'
                        : isRental
                        ? '🏠 Rental Business'
                        : '💼 Other Business'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {isActive ? (
                    <span className="px-2 py-0.5 rounded bg-[#A678B9] text-white text-[10px] font-black uppercase border border-blackstone shadow-xs">
                      Active
                    </span>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => switchBook(b.id)}>
                      Switch
                    </Button>
                  )}

                  {books.length > 1 && (
                    <button
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${b.name}"?`)) {
                          deleteBusiness(b.id);
                        }
                      }}
                      className="p-1.5 rounded text-blackstone/40 hover:text-danger transition-colors cursor-pointer"
                      title="Delete business"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* 2. Active Business Configuration Card */}
      <Card shadowSize="lg" className="space-y-4">
        <h2 className="text-sm font-bold font-heading text-blackstone uppercase tracking-wider border-b border-blackstone/10 pb-2">
          Active Business Settings
        </h2>

        <form onSubmit={handleSaveBookDetails} className="space-y-3.5">
          <Input
            label="Business Name"
            value={bookName}
            onChange={(e) => setBookName(e.target.value)}
            className="focus:ring-[#A678B9]"
            required
          />

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80 mb-1.5">
              Business Category
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Retail / Wholesale Option */}
              <button
                type="button"
                onClick={() => setCategory('retail')}
                className={`p-3 rounded-control border-2 text-left transition-all cursor-pointer ${
                  category === 'retail'
                    ? 'border-blackstone bg-citron-lime shadow-[3px_3px_0px_#A678B9] translate-x-[-1px] translate-y-[-1px]'
                    : 'border-blackstone/30 bg-surface hover:border-blackstone'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 font-extrabold text-xs text-blackstone">
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>Retail / Wholesale</span>
                </div>
                <p className="text-[10px] text-blackstone/75 leading-tight">
                  Inventory items, weighted avg COGS & sales.
                </p>
              </button>

              {/* Rental Option */}
              <button
                type="button"
                onClick={() => setCategory('rental')}
                className={`p-3 rounded-control border-2 text-left transition-all cursor-pointer ${
                  category === 'rental'
                    ? 'border-blackstone bg-vivid-amber shadow-[3px_3px_0px_#A678B9] translate-x-[-1px] translate-y-[-1px]'
                    : 'border-blackstone/30 bg-surface hover:border-blackstone'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 font-extrabold text-xs text-blackstone">
                  <Home className="w-3.5 h-3.5" />
                  <span>Rental Business</span>
                </div>
                <p className="text-[10px] text-blackstone/75 leading-tight">
                  Rooms, tenants, rent due dates & 10-day alerts.
                </p>
              </button>

              {/* Other Option */}
              <button
                type="button"
                onClick={() => setCategory('other')}
                className={`p-3 rounded-control border-2 text-left transition-all cursor-pointer ${
                  category === 'other'
                    ? 'border-blackstone bg-electric-sky shadow-[3px_3px_0px_#A678B9] translate-x-[-1px] translate-y-[-1px]'
                    : 'border-blackstone/30 bg-surface hover:border-blackstone'
                }`}
              >
                <div className="flex items-center gap-1.5 mb-1 font-extrabold text-xs text-blackstone">
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>Other Business</span>
                </div>
                <p className="text-[10px] text-blackstone/75 leading-tight">
                  Standard store, shop, service & general expenses.
                </p>
              </button>
            </div>
          </div>

          {/* Configurable Low-Stock Notification Threshold (Retail Category) */}
          {category === 'retail' && (
            <div className="p-3 rounded-control bg-canvas border-2 border-blackstone space-y-2">
              <label className="block text-xs font-black uppercase tracking-wider text-blackstone font-heading">
                Low-Stock Notification Threshold
              </label>
              <p className="text-[11px] text-text-secondary leading-snug font-medium">
                Items with stock at or below this number are flagged as <strong>Running Low</strong>. Stock at 0 is flagged as <strong>Empty</strong>.
              </p>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="1000"
                  value={thresholdInput}
                  onChange={(e) => setThresholdInput(e.target.value)}
                  className="w-24 h-10 px-3 bg-surface text-blackstone font-mono font-black text-sm rounded-control border-2 border-blackstone outline-none focus:ring-2 focus:ring-[#A678B9] focus:border-[#A678B9]"
                  required
                />
                <div className="flex items-center gap-1">
                  {[5, 10, 15, 20].map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setThresholdInput(String(preset))}
                      className={`px-2 py-1 text-xs font-bold rounded border cursor-pointer transition-all ${
                        thresholdInput === String(preset)
                          ? 'bg-[#A678B9] text-white border-blackstone font-black shadow-[2px_2px_0px_#A678B9]'
                          : 'bg-surface text-blackstone border-blackstone/30 hover:border-blackstone'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80 mb-1">
              Currency
            </label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full h-12 px-3 bg-surface text-blackstone font-bold rounded-control border-2 border-blackstone outline-none focus:ring-2 focus:ring-[#A678B9] focus:border-[#A678B9]"
            >
              {Object.values(SUPPORTED_CURRENCIES).map((curr) => (
                <option key={curr.code} value={curr.code}>
                  {curr.code} ({curr.symbol}) — {curr.name}
                </option>
              ))}
            </select>
          </div>

          {currency !== book?.currencyCode && (
            <div className="p-3 bg-vivid-amber-tint border border-vivid-amber rounded-control flex items-start gap-2 text-xs text-blackstone font-medium">
              <AlertTriangle className="w-4 h-4 text-vivid-amber-dark shrink-0 mt-0.5" />
              <span>
                <strong>Warning:</strong> Changing currency changes future display only. Existing recorded amounts are not converted.
              </span>
            </div>
          )}

          {saveMessage && (
            <div className="p-2.5 bg-citron-lime-tint border border-citron-lime rounded-control text-xs font-extrabold text-blackstone">
              ✓ {saveMessage}
            </div>
          )}

          <Button type="submit" variant="primary" size="md" className="w-full">
            Save Business Details
          </Button>
        </form>
      </Card>

      {/* 3. Supabase Cloud Database Integration Card */}
      <Card shadowSize="lg" className="space-y-3.5">
        <div className="border-b border-blackstone/10 pb-2 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold font-heading text-blackstone uppercase tracking-wider flex items-center gap-2">
              <Cloud className="w-3.5 h-3.5 text-slate-navy" />
              <span>Supabase Cloud Integration</span>
            </h2>
            <p className="text-xs text-text-secondary mt-0.5">
              Dual Local-First + Remote PostgreSQL database backup and cross-device sync.
            </p>
          </div>
          <span
            className={`px-2 py-0.5 text-[10px] font-extrabold uppercase rounded border border-blackstone ${
              cloudSyncStatus === 'synced'
                ? 'bg-citron-lime text-blackstone'
                : cloudSyncStatus === 'syncing'
                ? 'bg-electric-sky text-blackstone animate-pulse'
                : 'bg-surface text-text-secondary'
            }`}
          >
            {cloudSyncStatus}
          </span>
        </div>

        <div className="space-y-3">
          <div className="p-3 bg-surface border-2 border-blackstone rounded-control text-xs space-y-1.5">
            <div className="flex justify-between items-center text-text-secondary font-semibold">
              <span>Database Engine:</span>
              <strong className="text-blackstone">Supabase PostgreSQL 17</strong>
            </div>
            <div className="flex justify-between items-center text-text-secondary font-semibold">
              <span>Cloud Status:</span>
              <span className="font-extrabold text-blackstone flex items-center gap-1">
                {isCloudConfigured ? (
                  <>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Connected & Ready
                  </>
                ) : (
                  'Not Configured'
                )}
              </span>
            </div>
            {lastSyncTime && (
              <div className="flex justify-between items-center text-text-secondary font-semibold">
                <span>Last Cloud Sync:</span>
                <span className="text-blackstone font-mono">{new Date(lastSyncTime).toLocaleTimeString()}</span>
              </div>
            )}
          </div>

          <Button
            variant="secondary"
            size="md"
            className="w-full justify-center gap-2"
            onClick={handleSyncWithSupabase}
            disabled={cloudSyncStatus === 'syncing'}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blackstone ${cloudSyncStatus === 'syncing' ? 'animate-spin' : ''}`} />
            {cloudSyncStatus === 'syncing' ? 'Syncing with Supabase...' : 'Sync Now with Supabase'}
          </Button>

          {syncFeedback && (
            <div className="p-2.5 bg-citron-lime-tint border border-citron-lime rounded-control text-xs font-bold text-blackstone">
              {syncFeedback}
            </div>
          )}
        </div>
      </Card>

      {/* 4. Manual Backup & Portability Card */}
      <Card shadowSize="lg" className="space-y-3.5">
        <div className="border-b border-blackstone/10 pb-2">
          <h2 className="text-sm font-bold font-heading text-blackstone uppercase tracking-wider">
            Offline Backup & File Portability
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            In addition to Supabase cloud sync, you can export physical files to your device.
          </p>
        </div>

        <div className="space-y-2.5">
          {/* JSON Export */}
          <div>
            <Button variant="primary" size="md" className="w-full justify-between" onClick={downloadBackup}>
              <span className="flex items-center gap-2">
                <Download className="w-3.5 h-3.5" />
                Export JSON Backup
              </span>
              <span className="text-[10px] font-mono opacity-80">.json</span>
            </Button>
            <p className="text-[11px] text-text-secondary mt-1 px-1">
              Creates a versioned backup file containing all transactions and settings.
            </p>
          </div>

          {/* JSON Restore */}
          <div className="pt-2 border-t border-blackstone/10">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelected}
              accept=".json,application/json"
              className="hidden"
            />
            <Button
              variant="secondary"
              size="md"
              className="w-full justify-between"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="flex items-center gap-2">
                <Upload className="w-3.5 h-3.5 text-blackstone" />
                Restore Ledger from File
              </span>
              <span className="text-[10px] font-mono text-text-secondary">Upload</span>
            </Button>
            <p className="text-[11px] text-text-secondary mt-1 px-1">
              Select an exported POTFOLIOO backup to preview and restore on this device.
            </p>
          </div>

          {/* Excel Workbook Export (.xlsx) */}
          <div className="pt-2 border-t border-blackstone/10">
            <Button
              variant="primary"
              size="md"
              className="w-full justify-between bg-citron-lime text-blackstone hover:bg-citron-lime-dark"
              onClick={downloadExcel}
            >
              <span className="flex items-center gap-2">
                <FileSpreadsheet className="w-3.5 h-3.5 text-blackstone" />
                Download Excel Workbook (.xlsx)
              </span>
              <span className="text-[10px] font-mono font-black uppercase bg-blackstone text-citron-lime px-1.5 py-0.5 rounded">
                .xlsx
              </span>
            </Button>
            <p className="text-[11px] text-text-secondary mt-1 px-1">
              {book?.category === 'rental'
                ? 'Formatted Excel workbook with Tenant Name, Phone, Date Paid, Amount, Date Due, Price per Room, and Months Paid.'
                : 'Formatted Excel workbook with daily income, daily expenses, and preserved daily cash flow totals.'}
            </p>
          </div>

          {/* PDF Export for Retail / Wholesale Business, or CSV for Other Businesses */}
          {book?.category === 'retail' ? (
            <div className="pt-2 border-t border-blackstone/10">
              <Button
                variant="outline"
                size="md"
                className="w-full justify-between border-2 border-blackstone"
                onClick={downloadPDF}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-blackstone" />
                  Download Retail Report as PDF (.pdf)
                </span>
                <span className="text-[10px] font-mono font-black uppercase bg-blackstone text-white px-1.5 py-0.5 rounded">
                  .pdf
                </span>
              </Button>
              <p className="text-[11px] text-text-secondary mt-1 px-1">
                Printable PDF report with inventory items, sales records, payment channel totals (Cash, Mobile, Bank), debtors, and daily expenses.
              </p>
            </div>
          ) : (
            <div className="pt-2 border-t border-blackstone/10">
              <Button
                variant="outline"
                size="md"
                className="w-full justify-between border-2 border-blackstone"
                onClick={downloadCSV}
              >
                <span className="flex items-center gap-2">
                  <FileSpreadsheet className="w-3.5 h-3.5 text-blackstone" />
                  Export All Transactions as CSV
                </span>
                <span className="text-[10px] font-mono text-text-secondary">.csv</span>
              </Button>
            </div>
          )}
        </div>
      </Card>

      {/* 5. Fresh Start & Data Reset Card */}
      <Card shadowSize="lg" className="space-y-3.5 border-2 border-blackstone">
        <div className="border-b border-blackstone/10 pb-2">
          <h2 className="text-sm font-bold font-heading text-blackstone uppercase tracking-wider flex items-center gap-2">
            <Trash2 className="w-3.5 h-3.5 text-danger" />
            <span>Reset & Fresh Start</span>
          </h2>
          <p className="text-xs text-text-secondary mt-0.5">
            Clear recorded transactions or restart business onboarding with a completely fresh ledger.
          </p>
        </div>

        <div className="space-y-2.5">
          <Button
            type="button"
            variant="outline"
            size="md"
            className="w-full justify-center gap-2 border-2 border-blackstone text-blackstone hover:bg-canvas"
            onClick={async () => {
              if (book && confirm(`Are you sure you want to clear all transactions and inventory for "${book.name}"? This will reset your ledger to 0.`)) {
                await resetBusinessData(book.id);
                setSaveMessage('All transactions and inventory reset to 0. You have a fresh slate.');
              }
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 text-blackstone" />
            <span>Reset Active Ledger to 0</span>
          </Button>

          <Button
            type="button"
            variant="destructive"
            size="md"
            className="w-full justify-center gap-2 border-2 border-danger text-danger hover:bg-danger/5"
            onClick={async () => {
              if (confirm('Are you sure you want to restart business onboarding? This will remove existing business records so you can set up fresh.')) {
                await restartOnboarding();
              }
            }}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Restart Business Setup from Scratch</span>
          </Button>
        </div>
      </Card>

      {/* Add Business Modal */}
      <AddBusinessModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreate={async (name, cat) => {
          await createBusiness(name, cat);
        }}
      />
    </div>
  );
};
