import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X, Home, Wrench, Calculator, Calendar } from 'lucide-react';
import { calculateMonthsPaid, calculateDueDate } from '../../../domain/models/rental';
import { getTodayDateString } from '../../../domain/date';

interface RentalTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currencyCode: string;
  onSaveRentPayment: (data: {
    tenantName: string;
    roomNumber: string;
    phoneNumber?: string;
    amountInput: string;
    chargePerRoomInput: string;
    datePaid: string;
    dueDate?: string;
    note?: string;
  }) => Promise<void>;
  onSavePropertyExpense: (data: {
    amountInput: string;
    transactionDate: string;
    category: string;
    note?: string;
  }) => Promise<void>;
}

export const RentalTransactionModal: React.FC<RentalTransactionModalProps> = ({
  isOpen,
  onClose,
  currencyCode,
  onSaveRentPayment,
  onSavePropertyExpense,
}) => {
  const [mode, setMode] = useState<'rent' | 'expense'>('rent');

  // Rent Payment Form State
  const [tenantName, setTenantName] = useState('');
  const [roomNumber, setRoomNumber] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amountPaid, setAmountPaid] = useState('');
  const [chargePerRoom, setChargePerRoom] = useState('');
  const [datePaid, setDatePaid] = useState(getTodayDateString());
  const [dueDate, setDueDate] = useState('');
  const [rentNote, setRentNote] = useState('');

  // Property Expense Form State
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDate, setExpenseDate] = useState(getTodayDateString());
  const [expenseCategory, setExpenseCategory] = useState('Renovations');
  const [expenseNote, setExpenseNote] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Live Auto-Calculate Months Paid & Due Date
  const parsedAmount = parseFloat(amountPaid.replace(/,/g, '')) || 0;
  const parsedCharge = parseFloat(chargePerRoom.replace(/,/g, '')) || 0;
  const calculatedMonths = parsedCharge > 0 ? calculateMonthsPaid(parsedAmount * 100, parsedCharge * 100) : 0;

  useEffect(() => {
    if (datePaid && calculatedMonths > 0) {
      const autoDue = calculateDueDate(datePaid, calculatedMonths);
      setDueDate(autoDue);
    }
  }, [datePaid, calculatedMonths]);

  if (!isOpen) return null;

  const handleRentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantName.trim()) {
      setError('Tenant name is required');
      return;
    }
    if (!roomNumber.trim()) {
      setError('Room number is required');
      return;
    }
    if (parsedAmount <= 0) {
      setError('Please enter a valid amount paid');
      return;
    }
    if (parsedCharge <= 0) {
      setError('Please enter the monthly charge per room');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSaveRentPayment({
        tenantName: tenantName.trim(),
        roomNumber: roomNumber.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        amountInput: amountPaid,
        chargePerRoomInput: chargePerRoom,
        datePaid,
        dueDate: dueDate || undefined,
        note: rentNote.trim() || undefined,
      });

      // Reset
      setTenantName('');
      setRoomNumber('');
      setPhoneNumber('');
      setAmountPaid('');
      setChargePerRoom('');
      setRentNote('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save rent payment');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(expenseAmount.replace(/,/g, '')) || 0;
    if (numAmount <= 0) {
      setError('Please enter a valid expense amount');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSavePropertyExpense({
        amountInput: expenseAmount,
        transactionDate: expenseDate,
        category: expenseCategory,
        note: expenseNote.trim() || undefined,
      });

      // Reset
      setExpenseAmount('');
      setExpenseNote('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-blackstone/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <Card shadowSize="lg" className="w-full max-w-lg bg-canvas border-2 border-blackstone p-5 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded bg-surface border-2 border-blackstone flex items-center justify-center hover:bg-canvas transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 text-blackstone" />
        </button>

        {/* Mode Switcher Tabs */}
        <div className="flex border-2 border-blackstone rounded-control p-1 bg-surface mb-4">
          <button
            type="button"
            onClick={() => {
              setMode('rent');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'rent'
                ? 'bg-citron-lime text-blackstone border-2 border-blackstone shadow-sm'
                : 'text-text-secondary hover:text-blackstone'
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Record Rent Payment</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('expense');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-black uppercase tracking-wider rounded flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mode === 'expense'
                ? 'bg-vivid-amber text-blackstone border-2 border-blackstone shadow-sm'
                : 'text-text-secondary hover:text-blackstone'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Property Expense</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2.5 bg-danger/10 border-2 border-danger rounded text-xs font-bold text-danger">
            {error}
          </div>
        )}

        {/* 1. RENT PAYMENT FORM */}
        {mode === 'rent' && (
          <form onSubmit={handleRentSubmit} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Tenant Full Name *"
                placeholder="e.g. Juma Bakari"
                value={tenantName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTenantName(e.target.value)}
                required
              />
              <Input
                label="Room / Unit Number *"
                placeholder="e.g. Room 4B"
                value={roomNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRoomNumber(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="e.g. 0712345678"
                value={phoneNumber}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setPhoneNumber(e.target.value)}
              />
              <Input
                label="Date Paid *"
                type="date"
                value={datePaid}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDatePaid(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={`Amount Paid (${currencyCode}) *`}
                type="number"
                step="any"
                placeholder="e.g. 600000"
                value={amountPaid}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAmountPaid(e.target.value)}
                required
              />
              <Input
                label={`Monthly Rent / Charge (${currencyCode}) *`}
                type="number"
                step="any"
                placeholder="e.g. 200000"
                value={chargePerRoom}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setChargePerRoom(e.target.value)}
                required
              />
            </div>

            {/* Calculated Months & Due Date Preview Card */}
            {parsedCharge > 0 && parsedAmount > 0 && (
              <div className="p-3 bg-citron-lime-tint border-2 border-blackstone rounded-control space-y-1.5">
                <div className="flex items-center justify-between text-xs font-extrabold text-blackstone">
                  <span className="flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5 text-citron-lime-dark" />
                    <span>Calculated Coverage:</span>
                  </span>
                  <span className="px-2 py-0.5 rounded bg-citron-lime border border-blackstone text-[11px] font-black">
                    {calculatedMonths} {calculatedMonths === 1 ? 'Month' : 'Months'}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-bold text-text-secondary">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Auto-Computed Next Due Date:</span>
                  </span>
                  <span className="font-mono text-blackstone font-extrabold">{dueDate}</span>
                </div>
              </div>
            )}

            <Input
              label="Next Rent Due Date (Customizable)"
              type="date"
              value={dueDate}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDueDate(e.target.value)}
              required
            />

            <Input
              label="Payment Note / Receipt No (Optional)"
              placeholder="e.g. Bank transfer / M-Pesa ref"
              value={rentNote}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRentNote(e.target.value)}
            />

            <div className="pt-2 flex gap-2">
              <Button type="button" variant="outline" size="md" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" className="flex-1 bg-citron-lime text-blackstone" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Record Rent'}
              </Button>
            </div>
          </form>
        )}

        {/* 2. PROPERTY EXPENSE FORM */}
        {mode === 'expense' && (
          <form onSubmit={handleExpenseSubmit} className="space-y-3.5">
            <div>
              <label className="block text-xs font-extrabold uppercase tracking-wider text-blackstone/80 mb-1">
                Property Expense Category *
              </label>
              <select
                value={expenseCategory}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setExpenseCategory(e.target.value)}
                className="w-full h-12 px-3 bg-surface text-blackstone font-bold rounded-control border-2 border-blackstone outline-none focus:ring-2 focus:ring-vivid-amber"
              >
                <option value="Renovations">🔨 Renovations</option>
                <option value="Decorating">🎨 Decorating & Painting</option>
                <option value="Maintenance & Repairs">🔧 Repairs & Maintenance</option>
                <option value="Plumbing">🚰 Plumbing</option>
                <option value="Electrical">⚡ Electrical Work</option>
                <option value="Property Taxes / Legal">📄 Property Taxes & Permits</option>
                <option value="Cleaning & Caretaking">🧹 Cleaning & Caretaking</option>
                <option value="Other Property Expense">📦 Other Property Outflow</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Input
                label={`Expense Amount (${currencyCode}) *`}
                type="number"
                step="any"
                placeholder="e.g. 150000"
                value={expenseAmount}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpenseAmount(e.target.value)}
                required
              />
              <Input
                label="Date Incurred *"
                type="date"
                value={expenseDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpenseDate(e.target.value)}
                required
              />
            </div>

            <Input
              label="Expense Description / Note"
              placeholder="e.g. Repainting room 3 & corridor walls"
              value={expenseNote}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setExpenseNote(e.target.value)}
            />

            <div className="pt-2 flex gap-2">
              <Button type="button" variant="outline" size="md" className="flex-1" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="md" className="flex-1 bg-vivid-amber text-blackstone" disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Record Expense'}
              </Button>
            </div>
          </form>
        )}
      </Card>
    </div>
  );
};
