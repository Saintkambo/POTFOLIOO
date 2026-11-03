import React, { useState } from 'react';
import { useBook } from '../../context/BookContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { RentalRemindersWidget } from './RentalRemindersWidget';
import { RentalTransactionModal } from './RentalTransactionModal';
import { formatMoney } from '../../../domain/money';
import { Home, Wrench, ArrowUpRight, ArrowDownRight, Phone, Calendar, Plus, Trash2, FileSpreadsheet, AlertCircle, CheckCircle2, Search } from 'lucide-react';
import { MonthNavigator } from '../molecules/MonthNavigator';

interface RentalDashboardViewProps {
  onDeleteTransaction?: (id: string) => void;
}

export const RentalDashboardView: React.FC<RentalDashboardViewProps> = ({ onDeleteTransaction }) => {
  const {
    book,
    selectedMonth,
    rentalSummary,
    rentalReminders,
    monthTransactions,
    allTransactions,
    addRentalPayment,
    addPropertyExpense,
    removeTransaction,
    downloadExcel,
  } = useBook();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewScope, setViewScope] = useState<'month' | 'all'>('month');
  const [searchQuery, setSearchQuery] = useState('');
  const [phoneNotice, setPhoneNotice] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const currencyCode = book?.currencyCode || 'TZS';

  const handleSaveRent = async (data: Parameters<typeof addRentalPayment>[0]) => {
    await addRentalPayment(data);
    const numAmt = parseFloat(data.amountInput.replace(/,/g, '')) || 0;
    setSuccessNotice(`Rent payment of ${formatMoney(numAmt * 100, currencyCode)} for ${data.tenantName} (${data.roomNumber}) recorded successfully!`);
    setTimeout(() => setSuccessNotice(null), 6000);
  };

  const handleSaveExpense = async (data: Parameters<typeof addPropertyExpense>[0]) => {
    await addPropertyExpense(data);
    setSuccessNotice(`Property expense for "${data.category}" recorded successfully!`);
    setTimeout(() => setSuccessNotice(null), 6000);
  };

  const handleCallTenant = (phone?: string | null, name?: string | null) => {
    const rawPhone = phone?.trim() || '';
    const cleanPhone = rawPhone.replace(/[^\d+]/g, '');

    if (!cleanPhone || !/\d/.test(cleanPhone)) {
      setPhoneNotice(`No valid phone number saved for "${name || 'tenant'}". Please update their record before calling.`);
      return;
    }

    setPhoneNotice(null);
    window.location.href = `tel:${cleanPhone}`;
  };

  // Determine transactions to display
  const baseTransactions = viewScope === 'month' ? monthTransactions : allTransactions;
  const filteredTransactions = baseTransactions.filter((txn) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      (txn.tenantName && txn.tenantName.toLowerCase().includes(q)) ||
      (txn.roomNumber && txn.roomNumber.toLowerCase().includes(q)) ||
      (txn.note && txn.note.toLowerCase().includes(q)) ||
      (txn.category && txn.category.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-4">
      {/* Month Navigator */}
      <MonthNavigator />

      {/* Success Notification Banner */}
      {successNotice && (
        <div
          role="status"
          className="p-3 bg-emerald-50 border-2 border-emerald-600 rounded-control text-xs font-black text-emerald-800 flex items-center justify-between gap-2 shadow-brutal-sm animate-fade-in"
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successNotice}</span>
          </div>
          <button
            type="button"
            onClick={() => setSuccessNotice(null)}
            className="text-emerald-800 hover:text-blackstone p-1 cursor-pointer font-black text-xs"
            aria-label="Dismiss message"
          >
            ✕
          </button>
        </div>
      )}

      {/* 1. Rental Financial Summary Cards (Total Revenue & Property Expenses) */}
      <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
        {/* Total Revenue */}
        <Card shadowSize="md" className="bg-citron-lime-tint border-2 border-blackstone p-3.5 space-y-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-blackstone/80 truncate">
              Total Revenue
            </span>
            <div className="w-6 h-6 rounded bg-citron-lime border border-blackstone flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-3.5 h-3.5 text-blackstone stroke-[2.2]" />
            </div>
          </div>
          <div
            className="text-lg sm:text-xl font-black font-heading text-blackstone tracking-tight tabular-nums truncate block my-0.5"
            title={formatMoney(rentalSummary.totalRentsCollectedMinor, currencyCode)}
          >
            {formatMoney(rentalSummary.totalRentsCollectedMinor, currencyCode)}
          </div>
          <span className="text-[10px] font-bold text-text-secondary block">
            Collected this month
          </span>
        </Card>

        {/* Total Property Expenses */}
        <Card shadowSize="md" className="bg-vivid-amber-tint border-2 border-blackstone p-3.5 space-y-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-blackstone/80 truncate">
              Property Expenses
            </span>
            <div className="w-6 h-6 rounded bg-vivid-amber border border-blackstone flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-3.5 h-3.5 text-blackstone stroke-[2.2]" />
            </div>
          </div>
          <div
            className="text-lg sm:text-xl font-black font-heading text-blackstone tracking-tight tabular-nums truncate block my-0.5"
            title={`-${formatMoney(rentalSummary.totalPropertyExpensesMinor, currencyCode)}`}
          >
            -{formatMoney(rentalSummary.totalPropertyExpensesMinor, currencyCode)}
          </div>
          <span className="text-[10px] font-bold text-text-secondary block">
            Renovations & maintenance
          </span>
        </Card>
      </div>

      {/* 2. Rent Due Reminders Widget (10-Day & Due Alerts) */}
      <RentalRemindersWidget reminders={rentalReminders} currencyCode={currencyCode} />

      {/* 3. Action Buttons */}
      <div className="grid grid-cols-2 gap-3">
        <Button
          variant="primary"
          size="md"
          className="bg-citron-lime text-blackstone border-2 border-blackstone flex items-center justify-center gap-1.5 shadow-brutal neo-press text-xs font-black"
          onClick={() => setIsModalOpen(true)}
        >
          <Home className="w-3.5 h-3.5" />
          <span>Record Rent Payment</span>
        </Button>

        <Button
          variant="secondary"
          size="md"
          className="bg-vivid-amber text-blackstone border-2 border-blackstone flex items-center justify-center gap-1.5 shadow-brutal neo-press text-xs font-black"
          onClick={() => setIsModalOpen(true)}
        >
          <Wrench className="w-3.5 h-3.5" />
          <span>Property Expense</span>
        </Button>
      </div>

      {/* 4. Rental Transactions Ledger */}
      <Card shadowSize="md" className="p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-blackstone/10 pb-2">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-blackstone font-heading">
              Rental Ledger ({filteredTransactions.length})
            </h3>
            {/* View Scope Switcher Tabs */}
            <div className="flex border border-blackstone rounded bg-surface p-0.5 text-[10px] font-black">
              <button
                type="button"
                onClick={() => setViewScope('month')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                  viewScope === 'month'
                    ? 'bg-blackstone text-white shadow-xs'
                    : 'text-text-secondary hover:text-blackstone'
                }`}
              >
                This Month ({monthTransactions.length})
              </button>
              <button
                type="button"
                onClick={() => setViewScope('all')}
                className={`px-2 py-0.5 rounded cursor-pointer transition-all ${
                  viewScope === 'all'
                    ? 'bg-blackstone text-white shadow-xs'
                    : 'text-text-secondary hover:text-blackstone'
                }`}
              >
                All History ({allTransactions.length})
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {viewScope === 'month' && (
              <span className="text-[11px] font-mono text-text-secondary">
                {selectedMonth}
              </span>
            )}
            <button
              onClick={downloadExcel}
              title="Download Excel workbook (.xlsx)"
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-extrabold border border-blackstone bg-surface hover:bg-canvas transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3 h-3 text-blackstone" />
              <span>Export .xlsx</span>
            </button>
          </div>
        </div>

        {/* Quick Search */}
        {baseTransactions.length > 2 && (
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
            <input
              type="text"
              placeholder="Search by tenant name, room number, or note..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs font-bold bg-surface border border-blackstone/30 rounded-control focus:border-blackstone outline-none"
            />
          </div>
        )}

        {phoneNotice && (
          <div
            role="alert"
            className="p-3 bg-rose-50 border-2 border-danger rounded-control text-xs font-bold text-danger flex items-start justify-between gap-2 animate-in fade-in"
          >
            <div className="flex items-start gap-2 min-w-0">
              <AlertCircle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <p className="font-extrabold text-blackstone leading-tight">Unable to Call</p>
                <p className="text-[11px] leading-snug">{phoneNotice}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPhoneNotice(null)}
              className="text-blackstone/60 hover:text-blackstone p-1 rounded cursor-pointer shrink-0 font-black text-xs"
              aria-label="Dismiss message"
            >
              ✕
            </button>
          </div>
        )}

        {filteredTransactions.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <p className="text-xs font-bold text-text-secondary">
              {viewScope === 'month'
                ? `No rent payments or property expenses recorded in ${selectedMonth}.`
                : 'No rental records found.'}
            </p>
            {viewScope === 'month' && allTransactions.length > 0 && (
              <p className="text-[11px] text-text-secondary font-medium">
                You have {allTransactions.length} recorded entry in other months.{' '}
                <button
                  type="button"
                  onClick={() => setViewScope('all')}
                  className="text-slate-navy font-bold underline cursor-pointer"
                >
                  View All History →
                </button>
              </p>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 mx-auto text-xs"
              onClick={() => setIsModalOpen(true)}
            >
              <Plus className="w-3 h-3" />
              <span>Record Rent Payment</span>
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredTransactions.map((txn) => {
              const isIncome = txn.type === 'income';

              return (
                <div
                  key={txn.id}
                  className="p-3 bg-surface border-2 border-blackstone rounded-control flex items-center justify-between gap-3 shadow-sm hover:shadow-brutal transition-all"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {isIncome ? (
                        <>
                          <span className="px-2 py-0.5 rounded bg-blackstone text-citron-lime text-[11px] font-black">
                            {txn.roomNumber ? `Room ${txn.roomNumber}` : 'Rent'}
                          </span>
                          <span className="font-extrabold text-sm text-blackstone truncate">
                            {txn.tenantName || 'Tenant Payment'}
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="px-2 py-0.5 rounded bg-vivid-amber text-blackstone text-[11px] font-black border border-blackstone">
                            {txn.category || 'Expense'}
                          </span>
                          <span className="font-extrabold text-sm text-blackstone truncate">
                            {txn.note || 'Property Expense'}
                          </span>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-text-secondary font-medium flex-wrap">
                      <span>Paid: {txn.transactionDate}</span>
                      {txn.monthsPaid && (
                        <span>• {txn.monthsPaid} {txn.monthsPaid === 1 ? 'Month' : 'Months'}</span>
                      )}
                      {txn.dueDate && (
                        <span className="flex items-center gap-1 font-mono text-blackstone font-bold">
                          <Calendar className="w-2.5 h-2.5" />
                          Due: {txn.dueDate}
                        </span>
                      )}
                      {txn.phoneNumber && (
                        <button
                          type="button"
                          onClick={() => handleCallTenant(txn.phoneNumber, txn.tenantName)}
                          className="inline-flex items-center gap-1 text-slate-navy hover:underline cursor-pointer"
                          title={`Call ${txn.tenantName || 'Tenant'} (${txn.phoneNumber})`}
                        >
                          <Phone className="w-2.5 h-2.5" />
                          <span>{txn.phoneNumber}</span>
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 shrink-0">
                    <div className="text-right">
                      <span
                        className={`text-sm sm:text-base font-black font-heading block tabular-nums ${
                          isIncome ? 'text-emerald-700' : 'text-vivid-amber-dark'
                        }`}
                      >
                        {isIncome ? '' : '-'}{formatMoney(txn.amountMinor, currencyCode)}
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        if (onDeleteTransaction) {
                          onDeleteTransaction(txn.id);
                        } else {
                          removeTransaction(txn.id);
                        }
                      }}
                      className="w-7 h-7 rounded border border-blackstone/30 flex items-center justify-center text-text-secondary hover:text-danger hover:border-danger transition-colors cursor-pointer"
                      title="Delete entry"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Modal */}
      <RentalTransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currencyCode={currencyCode}
        onSaveRentPayment={handleSaveRent}
        onSavePropertyExpense={handleSaveExpense}
      />
    </div>
  );
};
