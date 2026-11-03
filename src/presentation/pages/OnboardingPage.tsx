import React, { useState, useEffect } from 'react';
import { useBook } from '../context/BookContext';
import { DEFAULT_CURRENCY } from '../../domain/money';
import { BusinessCategory } from '../../domain/models/book';
import { BusinessType, TANZANIAN_REGIONS } from '../../domain/models/business';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import {
  BookOpen,
  ShoppingBag,
  Home,
  Briefcase,
  Store,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building,
  Check,
} from 'lucide-react';

const DRAFT_KEY = 'potfolioo_onboarding_draft';

export const OnboardingPage: React.FC = () => {
  const { createBusiness } = useBook();

  // Load persistent draft if user previously stepped away
  const [step, setStep] = useState<1 | 2 | 3>(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) {
        const parsed = JSON.parse(draft);
        return parsed.step || 1;
      }
    } catch {}
    return 1;
  });

  // Step 1: Business Information
  const [businessName, setBusinessName] = useState(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) return JSON.parse(draft).businessName || 'Safari Retail Store';
    } catch {}
    return 'Safari Retail Store';
  });

  const [businessType, setBusinessType] = useState<BusinessType>(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) return JSON.parse(draft).businessType || 'retail';
    } catch {}
    return 'retail';
  });

  const [location, setLocation] = useState(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) return JSON.parse(draft).location || 'Dar es Salaam';
    } catch {}
    return 'Dar es Salaam';
  });

  const [address, setAddress] = useState(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) return JSON.parse(draft).address || '';
    } catch {}
    return '';
  });

  // Step 2: Financial Settings
  const [currencyCode] = useState(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) return JSON.parse(draft).currencyCode || DEFAULT_CURRENCY;
    } catch {}
    return DEFAULT_CURRENCY;
  });

  const [financialYearStart, setFinancialYearStart] = useState(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) return JSON.parse(draft).financialYearStart || '01-01';
    } catch {}
    return '01-01';
  });

  const [accountingBasis, setAccountingBasis] = useState<'cash' | 'accrual'>(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) return JSON.parse(draft).accountingBasis || 'cash';
    } catch {}
    return 'cash';
  });

  const [vatRegistered, setVatRegistered] = useState(() => {
    try {
      const draft = localStorage.getItem(DRAFT_KEY);
      if (draft) return !!JSON.parse(draft).vatRegistered;
    } catch {}
    return false;
  });

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Save progress automatically to draft
  useEffect(() => {
    const draftData = {
      step,
      businessName,
      businessType,
      location,
      address,
      currencyCode,
      financialYearStart,
      accountingBasis,
      vatRegistered,
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData));
  }, [step, businessName, businessType, location, address, currencyCode, financialYearStart, accountingBasis, vatRegistered]);

  // Map business type to primary category
  const category: BusinessCategory =
    businessType === 'rental' ? 'rental' : businessType === 'retail' ? 'retail' : 'other';

  const handleStep1Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!businessName.trim()) {
      setError('Please enter your business name.');
      return;
    }
    setStep(2);
  };

  const handleStep2Next = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep(3);
  };

  const handleFinalConfirm = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await createBusiness(businessName.trim(), category, {
        name: businessName.trim(),
        type: businessType,
        category,
        location,
        address: address.trim() || undefined,
        currencyCode,
        financialYearStart,
        accountingPreferences: {
          basis: accountingBasis,
          vatRegistered,
        },
      });

      // Clear draft on successful launch
      localStorage.removeItem(DRAFT_KEY);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to launch business');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-canvas flex flex-col justify-center items-center px-4 py-8 selection:bg-electric-sky selection:text-blackstone">
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl space-y-5">
        
        {/* Brand Banner */}
        <div className="text-center space-y-1.5">
          <div className="w-14 h-14 bg-slate-navy text-white rounded-2xl border-2 border-blackstone shadow-brutal-lg flex items-center justify-center mx-auto">
            <BookOpen className="w-7 h-7 stroke-[2.2]" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-heading text-blackstone tracking-tight">
            POTFOLIOO
          </h1>
          <p className="text-xs font-semibold text-text-secondary max-w-xs mx-auto">
            Guided Business Onboarding & Setup
          </p>
        </div>

        {/* 4-Step Progress Indicator */}
        <div className="p-3 bg-surface border-2 border-blackstone rounded-control shadow-brutal-sm">
          <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-blackstone/80">
            <div className={`flex items-center gap-1.5 ${step >= 1 ? 'text-slate-navy' : 'text-text-secondary'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-blackstone ${step >= 1 ? 'bg-citron-lime text-blackstone' : 'bg-surface-muted'}`}>
                {step > 1 ? <Check className="w-3 h-3 stroke-[3]" /> : '1'}
              </span>
              <span className="hidden sm:inline">Information</span>
            </div>

            <div className="h-0.5 w-6 bg-blackstone/20" />

            <div className={`flex items-center gap-1.5 ${step >= 2 ? 'text-slate-navy' : 'text-text-secondary'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-blackstone ${step >= 2 ? 'bg-citron-lime text-blackstone' : 'bg-surface-muted'}`}>
                {step > 2 ? <Check className="w-3 h-3 stroke-[3]" /> : '2'}
              </span>
              <span className="hidden sm:inline">Settings</span>
            </div>

            <div className="h-0.5 w-6 bg-blackstone/20" />

            <div className={`flex items-center gap-1.5 ${step === 3 ? 'text-slate-navy' : 'text-text-secondary'}`}>
              <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black border border-blackstone ${step === 3 ? 'bg-citron-lime text-blackstone' : 'bg-surface-muted'}`}>
                3
              </span>
              <span className="hidden sm:inline">Confirmation</span>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-danger/10 border-2 border-danger text-danger rounded-control text-xs font-bold flex items-center gap-2">
            <span>{error}</span>
          </div>
        )}

        {/* =========================================================================
            STEP 1: BUSINESS INFORMATION
            ========================================================================= */}
        {step === 1 && (
          <Card shadowSize="lg" className="space-y-5 p-6 sm:p-7">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-citron-lime-dark bg-citron-lime-tint px-2 py-0.5 rounded border border-citron-lime">
                Step 1 of 3
              </span>
              <h2 className="text-xl font-black font-heading text-blackstone tracking-tight">
                Business Information
              </h2>
              <p className="text-xs text-text-secondary">
                Tell us about your business entity to configure tailored bookkeeping tools.
              </p>
            </div>

            <form onSubmit={handleStep1Next} className="space-y-4">
              <Input
                label="Business Name"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Kariakoo Wholesale Plaza"
                required
                leftIcon={<Building className="w-4 h-4" />}
              />

              <div className="space-y-2">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80">
                  Business Operating Model
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {/* Retail / Stock */}
                  <button
                    type="button"
                    onClick={() => setBusinessType('retail')}
                    className={`p-3 rounded-control border-2 text-left transition-all cursor-pointer ${
                      businessType === 'retail'
                        ? 'border-blackstone bg-citron-lime shadow-brutal'
                        : 'border-blackstone/30 bg-surface hover:border-blackstone'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <ShoppingBag className="w-4 h-4 text-blackstone" />
                      <span className="font-black text-xs text-blackstone">Retail & Wholesale</span>
                    </div>
                    <p className="text-[10px] text-blackstone/80 leading-tight">
                      Inventory stock items, weighted average COGS, and sales ledger.
                    </p>
                  </button>

                  {/* Rental */}
                  <button
                    type="button"
                    onClick={() => setBusinessType('rental')}
                    className={`p-3 rounded-control border-2 text-left transition-all cursor-pointer ${
                      businessType === 'rental'
                        ? 'border-blackstone bg-vivid-amber shadow-brutal'
                        : 'border-blackstone/30 bg-surface hover:border-blackstone'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Home className="w-4 h-4 text-blackstone" />
                      <span className="font-black text-xs text-blackstone">Property & Rentals</span>
                    </div>
                    <p className="text-[10px] text-blackstone/80 leading-tight">
                      Tenant rooms, payment terms, lease tracking, and due date dialer.
                    </p>
                  </button>

                  {/* Services */}
                  <button
                    type="button"
                    onClick={() => setBusinessType('services')}
                    className={`p-3 rounded-control border-2 text-left transition-all cursor-pointer ${
                      businessType === 'services'
                        ? 'border-blackstone bg-electric-sky shadow-brutal'
                        : 'border-blackstone/30 bg-surface hover:border-blackstone'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Briefcase className="w-4 h-4 text-blackstone" />
                      <span className="font-black text-xs text-blackstone">Services & Consulting</span>
                    </div>
                    <p className="text-[10px] text-blackstone/80 leading-tight">
                      Professional service billing, client invoices, and expenses.
                    </p>
                  </button>

                  {/* General */}
                  <button
                    type="button"
                    onClick={() => setBusinessType('other')}
                    className={`p-3 rounded-control border-2 text-left transition-all cursor-pointer ${
                      businessType === 'other'
                        ? 'border-blackstone bg-surface-muted shadow-brutal'
                        : 'border-blackstone/30 bg-surface hover:border-blackstone'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Store className="w-4 h-4 text-blackstone" />
                      <span className="font-black text-xs text-blackstone">General Trade / Other</span>
                    </div>
                    <p className="text-[10px] text-blackstone/80 leading-tight">
                      Fast daily income and expense tracking without inventory.
                    </p>
                  </button>
                </div>
              </div>

              {/* Location & Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80">
                    Operating Region
                  </label>
                  <select
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-control border-2 border-blackstone bg-surface text-blackstone font-bold text-xs focus:outline-none focus:ring-2 focus:ring-electric-sky"
                  >
                    {TANZANIAN_REGIONS.map((reg) => (
                      <option key={reg} value={reg}>
                        {reg}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80">
                    Physical Address / Market
                  </label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="e.g. Uhuru St, Kariakoo"
                    className="w-full px-3 py-2.5 rounded-control border-2 border-blackstone bg-surface text-blackstone font-medium text-xs focus:outline-none focus:ring-2 focus:ring-electric-sky"
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                fullWidth
                className="flex items-center justify-center gap-2 text-sm font-black mt-2"
              >
                <span>Continue to Financial Settings</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          </Card>
        )}

        {/* =========================================================================
            STEP 2: FINANCIAL SETTINGS
            ========================================================================= */}
        {step === 2 && (
          <Card shadowSize="lg" className="space-y-5 p-6 sm:p-7">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-citron-lime-dark bg-citron-lime-tint px-2 py-0.5 rounded border border-citron-lime">
                Step 2 of 3
              </span>
              <h2 className="text-xl font-black font-heading text-blackstone tracking-tight">
                Financial Settings
              </h2>
              <p className="text-xs text-text-secondary">
                Configure your accounting basis and reporting defaults.
              </p>
            </div>

            <form onSubmit={handleStep2Next} className="space-y-4">
              {/* Base Currency */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80">
                  Base Reporting Currency
                </label>
                <div className="p-3 bg-citron-lime-tint border-2 border-citron-lime rounded-control space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-blackstone">
                      🇹🇿 Tanzanian Shilling (TZS - TSh)
                    </span>
                    <span className="text-[10px] font-black bg-citron-lime px-2 py-0.5 rounded border border-blackstone">
                      Default & Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-blackstone/80 leading-tight">
                    All ledger transactions and reports format as whole numbers with thousands separators (e.g. TSh 1,000,000).
                  </p>
                </div>
              </div>

              {/* Financial Year Start */}
              <div className="space-y-1">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80">
                  Financial Year Start
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFinancialYearStart('01-01')}
                    className={`py-2 px-3 rounded-control border-2 text-xs font-extrabold transition-all cursor-pointer ${
                      financialYearStart === '01-01'
                        ? 'border-blackstone bg-electric-sky text-blackstone shadow-brutal-sm'
                        : 'border-blackstone/30 bg-surface'
                    }`}
                  >
                    January 1st (Calendar)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFinancialYearStart('07-01')}
                    className={`py-2 px-3 rounded-control border-2 text-xs font-extrabold transition-all cursor-pointer ${
                      financialYearStart === '07-01'
                        ? 'border-blackstone bg-electric-sky text-blackstone shadow-brutal-sm'
                        : 'border-blackstone/30 bg-surface'
                    }`}
                  >
                    July 1st (Fiscal)
                  </button>
                </div>
              </div>

              {/* Accounting Basis */}
              <div className="space-y-1.5">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80">
                  Accounting Preference
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAccountingBasis('cash')}
                    className={`p-2.5 rounded-control border-2 text-left transition-all cursor-pointer ${
                      accountingBasis === 'cash'
                        ? 'border-blackstone bg-citron-lime text-blackstone shadow-brutal-sm'
                        : 'border-blackstone/30 bg-surface'
                    }`}
                  >
                    <span className="block text-xs font-black">Cash Basis</span>
                    <span className="block text-[10px] text-blackstone/75 leading-tight">
                      Records income & expenses when payment is received or made.
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setAccountingBasis('accrual')}
                    className={`p-2.5 rounded-control border-2 text-left transition-all cursor-pointer ${
                      accountingBasis === 'accrual'
                        ? 'border-blackstone bg-citron-lime text-blackstone shadow-brutal-sm'
                        : 'border-blackstone/30 bg-surface'
                    }`}
                  >
                    <span className="block text-xs font-black">Accrual Basis</span>
                    <span className="block text-[10px] text-blackstone/75 leading-tight">
                      Records income when invoiced and expenses when incurred.
                    </span>
                  </button>
                </div>
              </div>

              {/* VAT Registration */}
              <div className="pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer p-3 bg-surface rounded-control border-2 border-blackstone select-none">
                  <input
                    type="checkbox"
                    checked={vatRegistered}
                    onChange={(e) => setVatRegistered(e.target.checked)}
                    className="w-4 h-4 accent-blackstone rounded"
                  />
                  <div>
                    <span className="block text-xs font-black text-blackstone">
                      Registered for VAT (TRA)
                    </span>
                    <span className="block text-[11px] text-text-secondary leading-tight">
                      Enable Tanzanian Revenue Authority Value Added Tax tracking on sales and expenses.
                    </span>
                  </div>
                </label>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2.5 pt-2">
                <Button
                  type="button"
                  variant="secondary"
                  size="lg"
                  onClick={() => setStep(1)}
                  className="flex items-center justify-center gap-1.5 text-xs font-black flex-1"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back</span>
                </Button>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="flex items-center justify-center gap-1.5 text-xs font-black flex-1"
                >
                  <span>Review Details</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* =========================================================================
            STEP 3: CONFIRMATION & LAUNCH
            ========================================================================= */}
        {step === 3 && (
          <Card shadowSize="lg" className="space-y-5 p-6 sm:p-7">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-wider text-citron-lime-dark bg-citron-lime-tint px-2 py-0.5 rounded border border-citron-lime">
                Step 3 of 3
              </span>
              <h2 className="text-xl font-black font-heading text-blackstone tracking-tight">
                Review & Confirm Setup
              </h2>
              <p className="text-xs text-text-secondary">
                Please verify your business information before creating your ledger.
              </p>
            </div>

            {/* Summary Review Card */}
            <div className="space-y-3 p-4 bg-surface-muted border-2 border-blackstone rounded-control">
              <div className="flex items-start justify-between border-b border-blackstone/10 pb-2.5">
                <div>
                  <span className="text-[10px] font-bold uppercase text-text-secondary">Business Name</span>
                  <p className="text-sm font-black text-blackstone">{businessName}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-extrabold text-slate-navy hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div className="flex items-start justify-between border-b border-blackstone/10 pb-2.5">
                <div>
                  <span className="text-[10px] font-bold uppercase text-text-secondary">Business Model</span>
                  <p className="text-xs font-black text-blackstone capitalize">
                    {businessType === 'retail'
                      ? 'Retail & Wholesale (Inventory Tracking)'
                      : businessType === 'rental'
                      ? 'Rental Property (Tenant Leases)'
                      : businessType === 'services'
                      ? 'Services & Consulting'
                      : 'General Trade'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-extrabold text-slate-navy hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div className="flex items-start justify-between border-b border-blackstone/10 pb-2.5">
                <div>
                  <span className="text-[10px] font-bold uppercase text-text-secondary">Location</span>
                  <p className="text-xs font-bold text-blackstone">
                    {location} {address ? `• ${address}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="text-xs font-extrabold text-slate-navy hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>

              <div className="flex items-start justify-between pt-0.5">
                <div>
                  <span className="text-[10px] font-bold uppercase text-text-secondary">Financial Settings</span>
                  <p className="text-xs font-bold text-blackstone">
                    Base: {currencyCode} (TSh) • Basis: {accountingBasis.toUpperCase()} • Year: {financialYearStart}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="text-xs font-extrabold text-slate-navy hover:underline cursor-pointer"
                >
                  Edit
                </button>
              </div>
            </div>

            {/* Launch Button */}
            <div className="space-y-2.5 pt-2">
              <Button
                type="button"
                variant="primary"
                size="lg"
                fullWidth
                loading={isSubmitting}
                onClick={handleFinalConfirm}
                className="flex items-center justify-center gap-2 text-sm font-black"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm & Launch Business Dashboard</span>
              </Button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full text-center text-xs font-extrabold text-text-secondary hover:text-blackstone cursor-pointer py-1"
              >
                ← Back to Financial Settings
              </button>
            </div>
          </Card>
        )}

      </div>
    </div>
  );
};
