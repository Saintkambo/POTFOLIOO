import React, { useState } from 'react';
import { useBook } from '../context/BookContext';
import { TransactionRow } from '../components/molecules/TransactionRow';
import { MonthNavigator } from '../components/molecules/MonthNavigator';
import { Button } from '../components/ui/Button';
import { Transaction, TransactionType } from '../../domain/models/transaction';
import { Search, Plus, FilterX, ShoppingBag, Receipt } from 'lucide-react';
import { clsx } from 'clsx';
import { RecordSaleModal } from '../components/organisms/RecordSaleModal';
import { AddStockModal } from '../components/organisms/AddStockModal';
import { RetailExpenseModal } from '../components/organisms/RetailExpenseModal';
import { RecordRepaymentModal } from '../components/organisms/RecordRepaymentModal';

interface TransactionsPageProps {
  onOpenAddModal: () => void;
  onOpenEditModal: (txn: Transaction) => void;
}

export const TransactionsPage: React.FC<TransactionsPageProps> = ({
  onOpenAddModal,
  onOpenEditModal,
}) => {
  const {
    monthTransactions,
    book,
    isRetailBusiness,
    inventoryItems,
    addInventoryItem,
    replenishStock,
    recordRetailSale,
    recordDebtRepayment,
    recordOperatingExpense,
  } = useBook();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<TransactionType | 'all'>('all');

  // Retail-specific modal states
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isRepayModalOpen, setIsRepayModalOpen] = useState(false);
  const [selectedRepayTxn, setSelectedRepayTxn] = useState<Transaction | null>(null);

  const currencyCode = book?.currencyCode || 'TZS';

  const filteredTransactions = monthTransactions.filter((txn) => {
    if (selectedType !== 'all' && txn.type !== selectedType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNote = txn.note?.toLowerCase().includes(q);
      const matchCat = txn.category?.toLowerCase().includes(q);
      const matchTenant = txn.tenantName?.toLowerCase().includes(q);
      const matchRoom = txn.roomNumber?.toLowerCase().includes(q);
      const matchCustomer = txn.customerName?.toLowerCase().includes(q);
      const matchItem = txn.itemName?.toLowerCase().includes(q);
      return matchNote || matchCat || matchTenant || matchRoom || matchCustomer || matchItem;
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-8">
      {/* Month Navigator */}
      <MonthNavigator />

      {/* Retail Action Buttons (Ledger is the designated place to record activity) */}
      {isRetailBusiness && (
        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="primary"
            size="md"
            className="bg-citron-lime text-blackstone border-2 border-blackstone flex items-center justify-center gap-1.5 shadow-brutal neo-press text-xs font-black h-11"
            onClick={() => setIsSaleModalOpen(true)}
          >
            <ShoppingBag className="w-4 h-4 shrink-0" />
            <span className="truncate">Record Sale</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            className="bg-vivid-amber text-blackstone border-2 border-blackstone flex items-center justify-center gap-1.5 shadow-brutal neo-press text-xs font-black h-11"
            onClick={() => setIsExpenseModalOpen(true)}
          >
            <Receipt className="w-4 h-4 shrink-0" />
            <span className="truncate">Operating Expense</span>
          </Button>

          <Button
            variant="secondary"
            size="md"
            className="bg-electric-sky text-blackstone border-2 border-blackstone flex items-center justify-center gap-1.5 shadow-brutal neo-press text-xs font-black h-11"
            onClick={() => setIsStockModalOpen(true)}
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span className="truncate">Add Stock</span>
          </Button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-3.5 h-3.5 text-blackstone/50 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={isRetailBusiness ? "Search item, customer, notes..." : "Search notes or categories..."}
          className="w-full h-11 pl-9 pr-3 bg-surface text-blackstone font-medium text-xs rounded-control border-2 border-blackstone outline-none focus:ring-2 focus:ring-electric-sky"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-blackstone/50 hover:text-blackstone cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>

      {/* Type Filter Chips */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex gap-2">
          {(['all', 'income', 'expense'] as const).map((typeKey) => {
            const isActive = selectedType === typeKey;
            const labels = {
              all: 'All',
              income: isRetailBusiness ? 'Sales' : 'Income',
              expense: isRetailBusiness ? 'Expenses' : 'Expenses',
            };

            return (
              <button
                key={typeKey}
                onClick={() => setSelectedType(typeKey)}
                className={clsx(
                  'px-3 py-1.5 rounded-full text-xs font-extrabold border-2 border-blackstone transition-all cursor-pointer neo-press',
                  isActive
                    ? 'bg-slate-navy text-white shadow-brutal-sm'
                    : 'bg-surface text-blackstone hover:bg-canvas'
                )}
              >
                {labels[typeKey]}
              </button>
            );
          })}
        </div>

        <span className="text-[11px] font-bold text-text-secondary tabular-nums">
          {filteredTransactions.length} items
        </span>
      </div>

      {/* Transactions List */}
      <div className="space-y-2.5">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((txn) => (
            <TransactionRow
              key={txn.id}
              transaction={txn}
              currencyCode={currencyCode}
              onClick={() => onOpenEditModal(txn)}
              onRepay={() => {
                setSelectedRepayTxn(txn);
                setIsRepayModalOpen(true);
              }}
            />
          ))
        ) : (
          <div className="bg-surface border-2 border-blackstone rounded-card p-6 text-center space-y-2 shadow-brutal-sm">
            <FilterX className="w-6 h-6 text-blackstone/40 mx-auto" />
            <p className="text-sm font-bold text-blackstone">No matching transactions</p>
            <p className="text-xs text-text-secondary">
              Try adjusting your search query or switching filters.
            </p>
            {(searchQuery || selectedType !== 'all') && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSearchQuery('');
                  setSelectedType('all');
                }}
                className="mt-2"
              >
                Reset Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Standard Business Quick Add CTA (for Non-Retail) */}
      {!isRetailBusiness && (
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
      )}

      {/* Retail Modals */}
      {isRetailBusiness && (
        <>
          <RecordSaleModal
            isOpen={isSaleModalOpen}
            onClose={() => setIsSaleModalOpen(false)}
            currencyCode={currencyCode}
            inventoryItems={inventoryItems}
            onRecordSale={recordRetailSale}
            onOpenAddStock={() => setIsStockModalOpen(true)}
          />

          <AddStockModal
            isOpen={isStockModalOpen}
            onClose={() => setIsStockModalOpen(false)}
            currencyCode={currencyCode}
            inventoryItems={inventoryItems}
            onAddNewItem={addInventoryItem}
            onReplenishStock={replenishStock}
          />

          <RetailExpenseModal
            isOpen={isExpenseModalOpen}
            onClose={() => setIsExpenseModalOpen(false)}
            currencyCode={currencyCode}
            onRecordExpense={recordOperatingExpense}
          />

          <RecordRepaymentModal
            isOpen={isRepayModalOpen}
            onClose={() => {
              setIsRepayModalOpen(false);
              setSelectedRepayTxn(null);
            }}
            transaction={selectedRepayTxn}
            currencyCode={currencyCode}
            onRecordRepayment={recordDebtRepayment}
          />
        </>
      )}
    </div>
  );
};
