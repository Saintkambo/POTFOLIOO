import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Receipt, AlertTriangle } from 'lucide-react';

function getLocalTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

const COMMON_RETAIL_EXPENSE_CATEGORIES = [
  'Shop Rent / Stall Fee',
  'Transport & Logistics',
  'Packaging & Bags',
  'Electricity & Utilities',
  'Staff Wages',
  'Permits & Licenses',
  'Security',
  'Other Operating Expense',
];

interface RetailExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencyCode: string;
  onRecordExpense: (data: {
    amountInput: string;
    transactionDate: string;
    category: string;
    note?: string;
  }) => Promise<void>;
}

export const RetailExpenseModal: React.FC<RetailExpenseModalProps> = ({
  isOpen,
  onClose,
  currencyCode,
  onRecordExpense,
}) => {
  const [amountInput, setAmountInput] = useState('');
  const [transactionDate, setTransactionDate] = useState(getLocalTodayDateString());
  const [category, setCategory] = useState(COMMON_RETAIL_EXPENSE_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = useState('');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmountInput('');
      setTransactionDate(getLocalTodayDateString());
      setCategory(COMMON_RETAIL_EXPENSE_CATEGORIES[0]);
      setCustomCategory('');
      setNote('');
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amountInput.replace(/,/g, ''));
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid expense amount');
      return;
    }

    const finalCategory = category === 'Other Operating Expense' && customCategory.trim()
      ? customCategory.trim()
      : category;

    try {
      setIsSubmitting(true);
      setError(null);
      await onRecordExpense({
        amountInput,
        transactionDate,
        category: finalCategory,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-modal z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-blackstone/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <Card
        shadowSize="lg"
        className="w-full max-w-lg h-[90dvh] sm:h-auto max-h-[90dvh] sm:max-h-[85vh] flex flex-col rounded-b-none sm:rounded-card border-x-0 sm:border-x-2 border-b-0 sm:border-b-2 border-t-2 border-blackstone bg-surface overflow-hidden"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-blackstone bg-canvas">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-control bg-vivid-amber border border-blackstone flex items-center justify-center">
              <Receipt className="w-4 h-4 text-blackstone stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-black font-heading text-blackstone leading-none">
                Record Operating Expense
              </h2>
              <p className="text-[11px] font-bold text-text-secondary mt-0.5">
                Daily store running expenses (separate from inventory purchase costs)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-control border border-blackstone bg-surface hover:bg-canvas flex items-center justify-center text-blackstone neo-press cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4">
          {error && (
            <div className="p-3 rounded-control bg-vivid-amber-tint border-2 border-vivid-amber-dark text-blackstone text-xs font-bold flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-vivid-amber-dark shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
              Expense Amount *
            </label>
            <Input
              type="text"
              inputMode="numeric"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              placeholder="e.g. 15,000"
              required
            />
            <span className="text-[10px] font-bold text-text-secondary block mt-1">
              Currency: {currencyCode}
            </span>
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
              Expense Category *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full h-11 px-3 text-sm font-bold border-2 border-blackstone rounded-control bg-surface focus:outline-hidden focus:border-electric-sky focus:ring-1 focus:ring-electric-sky"
            >
              {COMMON_RETAIL_EXPENSE_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {category === 'Other Operating Expense' && (
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                Specify Category *
              </label>
              <Input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Generator Fuel"
                required
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                Date *
              </label>
              <Input
                type="date"
                value={transactionDate}
                onChange={(e) => setTransactionDate(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                Description / Note
              </label>
              <Input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g. Paid transport driver"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t-2 border-blackstone/10">
            <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting}
              className="bg-vivid-amber text-blackstone border-2 border-blackstone font-black shadow-brutal neo-press"
            >
              {isSubmitting ? 'Recording...' : 'Record Expense'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
