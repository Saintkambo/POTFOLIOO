import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, HandCoins, AlertTriangle, Banknote, CreditCard, Smartphone, CheckCircle } from 'lucide-react';
import { Transaction, PaymentMethod } from '../../../domain/models/transaction';
import { formatMoney } from '../../../domain/money';

function getLocalTodayDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface RecordRepaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  currencyCode: string;
  onRecordRepayment: (data: {
    transactionId: string;
    amountInput: string;
    paymentMethod: PaymentMethod;
    repaymentDate: string;
    note?: string;
  }) => Promise<void>;
}

export const RecordRepaymentModal: React.FC<RecordRepaymentModalProps> = ({
  isOpen,
  onClose,
  transaction,
  currencyCode,
  onRecordRepayment,
}) => {
  const [amountInput, setAmountInput] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [repaymentDate, setRepaymentDate] = useState<string>(getLocalTodayDateString());
  const [note, setNote] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const outstandingMinor = transaction
    ? transaction.outstandingBalanceMinor ?? Math.max(0, transaction.amountMinor - (transaction.amountPaidMinor ?? 0))
    : 0;

  useEffect(() => {
    if (isOpen && transaction) {
      setAmountInput('');
      setPaymentMethod('cash');
      setRepaymentDate(getLocalTodayDateString());
      setNote('');
      setError(null);
    }
  }, [isOpen, transaction]);

  if (!isOpen || !transaction) return null;

  const numInput = parseFloat(amountInput.replace(/,/g, '')) || 0;
  const inputMinor = Math.round(numInput * 100);
  const remainingAfterPaymentMinor = Math.max(0, outstandingMinor - inputMinor);

  const handleFillFull = () => {
    setAmountInput(String(outstandingMinor / 100));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (numInput <= 0) {
      setError('Please enter a repayment amount greater than zero');
      return;
    }
    if (inputMinor > outstandingMinor) {
      setError(`Repayment cannot exceed outstanding debt of ${formatMoney(outstandingMinor, currencyCode)}`);
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onRecordRepayment({
        transactionId: transaction.id,
        amountInput,
        paymentMethod,
        repaymentDate,
        note: note.trim() || undefined,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to record repayment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-modal z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-blackstone/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
      <Card
        shadowSize="lg"
        className="w-full max-w-md h-[90dvh] sm:h-auto max-h-[90dvh] sm:max-h-[85vh] flex flex-col rounded-b-none sm:rounded-card border-x-0 sm:border-x-2 border-b-0 sm:border-b-2 border-t-2 border-blackstone bg-surface overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b-2 border-blackstone bg-canvas shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-control bg-electric-sky border border-blackstone flex items-center justify-center">
              <HandCoins className="w-4 h-4 text-blackstone stroke-[2.2]" />
            </div>
            <div>
              <h2 className="text-base font-black font-heading text-blackstone leading-none">
                Record Debt Repayment
              </h2>
              <p className="text-[11px] font-bold text-text-secondary mt-0.5">
                Reduces customer outstanding balance
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

        {/* Form Body & Sticky Footer */}
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0 overflow-hidden">
          <div className="p-4 overflow-y-auto space-y-4 flex-1 overscroll-contain">
            {error && (
              <div className="p-3 rounded-control bg-vivid-amber-tint border-2 border-vivid-amber-dark text-blackstone text-xs font-bold flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-vivid-amber-dark shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Customer & Debt Overview Card */}
            <div className="p-3 rounded-control bg-canvas border-2 border-blackstone space-y-2">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-black tracking-wider text-text-secondary font-heading block">
                    Customer
                  </span>
                  <span className="text-sm font-black text-blackstone font-heading">
                    {transaction.customerName || 'Customer'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-black tracking-wider text-text-secondary font-heading block">
                    Item Sold
                  </span>
                  <span className="text-xs font-bold text-blackstone">
                    {transaction.quantitySold ? `${transaction.quantitySold}x ` : ''}
                    {transaction.itemName || transaction.note || 'Retail item'}
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-blackstone/10 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-text-secondary block font-bold text-[11px]">Total Sale:</span>
                  <span className="font-mono font-bold text-blackstone">
                    {formatMoney(transaction.amountMinor, currencyCode)}
                  </span>
                </div>
                <div>
                  <span className="text-text-secondary block font-bold text-[11px]">Already Paid:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    {formatMoney(transaction.amountPaidMinor ?? 0, currencyCode)}
                  </span>
                </div>
              </div>

              <div className="pt-1 border-t border-blackstone/20 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-blackstone font-heading">
                  Outstanding Balance:
                </span>
                <span className="text-sm font-black font-heading text-rose-600 font-mono">
                  {formatMoney(outstandingMinor, currencyCode)}
                </span>
              </div>
            </div>

            {/* Amount to Repay */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-black uppercase tracking-wider text-blackstone font-heading">
                  Repayment Amount *
                </label>
                <button
                  type="button"
                  onClick={handleFillFull}
                  className="text-[11px] font-black text-blackstone underline decoration-blackstone hover:text-electric-sky cursor-pointer"
                >
                  Pay Full Balance
                </button>
              </div>
              <Input
                type="text"
                inputMode="numeric"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="e.g. 5,000"
                required
              />
              {numInput > 0 && (
                <div className="flex items-center justify-between mt-1 text-[11px] font-bold">
                  <span className="text-text-secondary">Remaining after this payment:</span>
                  <span className={`font-mono font-bold ${remainingAfterPaymentMinor === 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                    {remainingAfterPaymentMinor === 0 ? (
                      <span className="inline-flex items-center gap-1 text-emerald-700 font-black">
                        <CheckCircle className="w-3 h-3" /> Fully Cleared
                      </span>
                    ) : (
                      formatMoney(remainingAfterPaymentMinor, currencyCode)
                    )}
                  </span>
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1.5 font-heading">
                Payment Method *
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  className={`py-1.5 px-2 text-xs font-bold border-2 border-blackstone rounded-control flex items-center justify-center gap-1.5 neo-press ${
                    paymentMethod === 'cash'
                      ? 'bg-electric-sky text-blackstone font-black'
                      : 'bg-surface text-blackstone hover:bg-canvas'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  <span>Cash</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bank')}
                  className={`py-1.5 px-2 text-xs font-bold border-2 border-blackstone rounded-control flex items-center justify-center gap-1.5 neo-press ${
                    paymentMethod === 'bank'
                      ? 'bg-electric-sky text-blackstone font-black'
                      : 'bg-surface text-blackstone hover:bg-canvas'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Bank</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('mobile')}
                  className={`py-1.5 px-2 text-xs font-bold border-2 border-blackstone rounded-control flex items-center justify-center gap-1.5 neo-press ${
                    paymentMethod === 'mobile'
                      ? 'bg-electric-sky text-blackstone font-black'
                      : 'bg-surface text-blackstone hover:bg-canvas'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Mobile</span>
                </button>
              </div>
            </div>

            {/* Date & Note */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                  Repayment Date *
                </label>
                <Input
                  type="date"
                  value={repaymentDate}
                  onChange={(e) => setRepaymentDate(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-blackstone mb-1 font-heading">
                  Note (Optional)
                </label>
                <Input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g. Paid in cash"
                />
              </div>
            </div>
          </div>

          {/* Actions Footer */}
          <div className="p-3 border-t-2 border-blackstone/10 bg-canvas/95 backdrop-blur-xs flex items-center justify-end gap-2 shrink-0">
            <Button
              type="button"
              variant="ghost"
              size="md"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              disabled={isSubmitting || numInput <= 0 || inputMinor > outstandingMinor}
              className="bg-electric-sky text-blackstone border-2 border-blackstone font-black shadow-brutal neo-press"
            >
              {isSubmitting ? 'Recording...' : 'Record Repayment'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};
