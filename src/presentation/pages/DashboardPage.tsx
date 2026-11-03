import React from 'react';
import { useBook } from '../context/BookContext';
import { MonthNavigator } from '../components/molecules/MonthNavigator';
import { NetHeroCard } from '../components/organisms/NetHeroCard';
import { SummaryCards } from '../components/organisms/SummaryCards';
import { TransactionRow } from '../components/molecules/TransactionRow';
import { Button } from '../components/ui/Button';
import { Plus, BookOpen } from 'lucide-react';
import { Transaction } from '../../domain/models/transaction';
import { RentalDashboardView } from '../components/organisms/RentalDashboardView';
import { RetailDashboardView } from '../components/organisms/RetailDashboardView';

interface DashboardPageProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (txn: Transaction) => void;
  onNavigateToLedger: () => void;
  onNavigateToReports?: () => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  onOpenAddModal,
  onOpenEditModal,
  onNavigateToLedger,
  onNavigateToReports,
}) => {
  const { monthTransactions, book, isRentalBusiness, isRetailBusiness } = useBook();

  // If this is a Rental Business, render the full specialized Rental Experience!
  if (isRentalBusiness) {
    return <RentalDashboardView />;
  }

  // If this is a Retail / Wholesale Business, render the specialized Retail Experience!
  if (isRetailBusiness) {
    return (
      <RetailDashboardView
        onNavigateToLedger={onNavigateToLedger}
        onNavigateToReports={onNavigateToReports}
      />
    );
  }

  // Standard "Other Business" Flow
  const recentTransactions = monthTransactions.slice(0, 4);

  return (
    <div className="space-y-4">
      {/* 1. Month Navigator Bar */}
      <MonthNavigator />

      {/* 2. Visual Anchor: Net Hero Card */}
      <NetHeroCard />

      {/* 3. Summary Duo Cards */}
      <SummaryCards />

      {/* 4. Recent Transactions or Empty State */}
      <section className="space-y-2.5 pt-1">
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold font-heading text-blackstone tracking-tight">
            Recent Transactions
          </h2>
          {monthTransactions.length > 0 && (
            <button
              onClick={onNavigateToLedger}
              className="text-xs font-bold text-electric-sky-dark hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              See all ({monthTransactions.length}) →
            </button>
          )}
        </div>

        {recentTransactions.length > 0 ? (
          <div className="space-y-2.5">
            {recentTransactions.map((txn) => (
              <TransactionRow
                key={txn.id}
                transaction={txn}
                currencyCode={book?.currencyCode || 'TZS'}
                onClick={() => onOpenEditModal(txn)}
              />
            ))}
          </div>
        ) : (
          /* Empty State for Month */
          <div className="bg-surface border-2 border-blackstone rounded-card p-6 text-center space-y-3 shadow-brutal-sm">
            <div className="w-12 h-12 rounded-xl bg-citron-lime-tint border border-blackstone flex items-center justify-center mx-auto text-blackstone">
              <BookOpen className="w-5 h-5 stroke-[2]" />
            </div>
            <div>
              <p className="text-sm font-extrabold text-blackstone">No transactions for this month</p>
              <p className="text-xs text-text-secondary mt-0.5">
                Record your first income or expense to see your cash flow update automatically.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={onOpenAddModal} className="mt-1">
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Add First Transaction
            </Button>
          </div>
        )}
      </section>

      {/* 5. Floating / Sticky Primary Thumb Action */}
      <div className="pt-2">
        <Button
          variant="primary"
          size="lg"
          className="w-full text-base font-black shadow-brutal-lg"
          onClick={onOpenAddModal}
        >
          <Plus className="w-4 h-4 mr-2 stroke-[2.2]" />
          Add Transaction
        </Button>
      </div>
    </div>
  );
};
