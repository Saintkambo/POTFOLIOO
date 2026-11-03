import React, { useState, useEffect } from 'react';
import { Transaction, TransactionType } from '../../../domain/models/transaction';
import { getTodayDateString } from '../../../domain/date';
import { minorToDecimalString } from '../../../domain/money';
import { useBook } from '../../context/BookContext';
import { TypeSwitcher } from '../molecules/TypeSwitcher';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Trash2 } from 'lucide-react';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTransaction?: Transaction | null;
  onDeleteRequest?: (txn: Transaction) => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({
  isOpen,
  onClose,
  initialTransaction,
  onDeleteRequest,
}) => {
  const { book, addTransaction, editTransaction } = useBook();
  const [type, setType] = useState<TransactionType>('income');
  const [amount, setAmount] = useState<string>('');
  const [date, setDate] = useState<string>(getTodayDateString());
  const [category, setCategory] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (initialTransaction) {
      setType(initialTransaction.type);
      setAmount(minorToDecimalString(initialTransaction.amountMinor, book?.currencyCode));
      setDate(initialTransaction.transactionDate);
      setCategory(initialTransaction.category || '');
      setNote(initialTransaction.note || '');
    } else {
      setType('income');
      setAmount('');
      setDate(getTodayDateString());
      setCategory('');
      setNote('');
    }
    setError(null);
  }, [initialTransaction, isOpen, book]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      if (initialTransaction) {
        await editTransaction({
          id: initialTransaction.id,
          type,
          amountInput: amount,
          transactionDate: date,
          category,
          note,
        });
      } else {
        await addTransaction({
          type,
          amountInput: amount,
          transactionDate: date,
          category,
          note,
        });
      }
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = type === 'income' 
    ? ['Client Work', 'Sales', 'Consulting', 'Dividend', 'Other Income']
    : ['Office Supplies', 'Software', 'Meals', 'Utilities', 'Rent', 'Travel'];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-blackstone/60 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-surface border-t-2 sm:border-2 border-blackstone sm:rounded-card rounded-t-card p-5 shadow-brutal-xl max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-blackstone/10">
          <h2 className="text-lg font-bold font-heading tracking-tight text-blackstone">
            {initialTransaction ? 'Edit Transaction' : 'Record Transaction'}
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-blackstone bg-canvas flex items-center justify-center cursor-pointer hover:bg-blackstone/10"
          >
            <X className="w-3.5 h-3.5 text-blackstone" />
          </button>
        </div>

        {error && (
          <div role="alert" className="mt-3 p-3 bg-danger/10 border-2 border-danger rounded-control text-xs font-bold text-danger">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <TypeSwitcher value={type} onChange={setType} />

          {/* Amount input */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80 mb-1">
              Amount ({book?.currencyCode && book.currencyCode !== 'USD' ? book.currencyCode : 'TZS'})
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 text-base font-black text-blackstone font-mono select-none">
                TSh
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="0"
                className="w-full h-14 pl-14 pr-4 text-2xl font-black tabular-nums bg-surface border-2 border-blackstone rounded-control focus:ring-2 focus:ring-electric-sky outline-none"
                autoFocus={!initialTransaction}
              />
            </div>
          </div>

          {/* Date input */}
          <Input
            type="date"
            label="Transaction Date"
            value={date}
            onChange={e => setDate(e.target.value)}
            required
          />

          {/* Category */}
          <div>
            <Input
              type="text"
              label="Category (Optional)"
              value={category}
              onChange={e => setCategory(e.target.value)}
              placeholder="e.g. Supplies, Consulting"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className="px-2 py-0.5 text-xs font-bold bg-canvas border border-blackstone/30 rounded hover:border-blackstone active:bg-blackstone/10 cursor-pointer"
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Note */}
          <Input
            type="text"
            label="Note or Description (Optional)"
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Add details, invoice number, or client name"
          />

          {/* Action buttons */}
          <div className="pt-2 space-y-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full text-base"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : initialTransaction ? 'Update Transaction' : 'Save Transaction'}
            </Button>

            {initialTransaction && onDeleteRequest && (
              <Button
                type="button"
                variant="destructive"
                size="md"
                className="w-full"
                onClick={() => onDeleteRequest(initialTransaction)}
              >
                <Trash2 className="w-3.5 h-3.5 mr-2" />
                Delete Entry
              </Button>
            )}

            <Button
              type="button"
              variant="ghost"
              size="md"
              className="w-full"
              onClick={onClose}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
