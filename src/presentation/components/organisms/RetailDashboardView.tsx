import React, { useState, useMemo } from 'react';
import { useBook } from '../../context/BookContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { formatMoney } from '../../../domain/money';
import {
  Package,
  Search,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Eye,
  X,
  User,
  ArrowRight,
} from 'lucide-react';
import { MonthNavigator } from '../molecules/MonthNavigator';

interface RetailDashboardViewProps {
  onNavigateToLedger?: () => void;
  onNavigateToReports?: () => void;
}

export const RetailDashboardView: React.FC<RetailDashboardViewProps> = ({
  onNavigateToLedger,
}) => {
  const {
    book,
    selectedMonth,
    inventoryItems,
    inventoryAlerts,
    debtorAlerts,
    retailTodaySummary,
    monthTransactions,
  } = useBook();

  const currencyCode = book?.currencyCode || 'TZS';

  // View Inventory Modal state
  const [isViewInventoryOpen, setIsViewInventoryOpen] = useState(false);
  const [inventorySearch, setInventorySearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'empty'>('all');

  // Filtered inventory items for the View Inventory modal
  const filteredItems = useMemo(() => {
    return inventoryItems.filter((item) => {
      const matchesSearch = item.name.toLowerCase().includes(inventorySearch.toLowerCase().trim());
      const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [inventoryItems, inventorySearch, statusFilter]);

  // Total inventory valuation
  const totalInventoryValueMinor = useMemo(() => {
    return inventoryItems.reduce(
      (acc, item) => acc + item.currentQuantity * item.avgPurchasePriceMinor,
      0
    );
  }, [inventoryItems]);

  return (
    <div className="space-y-4">
      {/* 1. Relevant Notifications: Low/Empty Stock Alerts & Debtor Alerts */}
      {(inventoryAlerts.length > 0 || debtorAlerts.length > 0) && (
        <div className="space-y-2">
          {/* Inventory Alerts Banner */}
          {inventoryAlerts.length > 0 && (
            <div className="p-3.5 rounded-card bg-vivid-amber-tint border-2 border-blackstone shadow-brutal-sm space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-vivid-amber-dark shrink-0 stroke-[2.2]" />
                  <span className="text-xs font-black uppercase tracking-wider text-blackstone font-heading">
                    Stock Attention Required ({inventoryAlerts.length} item{inventoryAlerts.length > 1 ? 's' : ''})
                  </span>
                </div>
                {onNavigateToLedger && (
                  <button
                    onClick={onNavigateToLedger}
                    className="text-[11px] font-black text-blackstone hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Restock in Ledger</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {inventoryAlerts.map((alert) => (
                  <span
                    key={alert.itemId}
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-control border flex items-center gap-1.5 ${
                      alert.status === 'empty'
                        ? 'bg-rose-100 border-rose-500 text-rose-900 font-black'
                        : 'bg-amber-100 border-amber-500 text-amber-950'
                    }`}
                  >
                    <span>{alert.itemName}:</span>
                    <span className="font-mono">
                      {alert.status === 'empty' ? 'EMPTY (0)' : `${alert.currentQuantity} left`}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Debtor Alerts Banner */}
          {debtorAlerts.length > 0 && (
            <div className="p-3.5 rounded-card bg-rose-50 border-2 border-blackstone shadow-brutal-sm space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-rose-700 shrink-0 stroke-[2.2]" />
                  <span className="text-xs font-black uppercase tracking-wider text-blackstone font-heading">
                    Outstanding Customer Debts ({debtorAlerts.length} debtor{debtorAlerts.length > 1 ? 's' : ''})
                  </span>
                </div>
                {onNavigateToLedger && (
                  <button
                    onClick={onNavigateToLedger}
                    className="text-[11px] font-black text-rose-800 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <span>Record Repayment in Ledger</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {debtorAlerts.map((alert) => (
                  <span
                    key={alert.transactionId}
                    className="text-[11px] font-bold px-2 py-0.5 rounded-control border border-rose-300 bg-white text-rose-900 flex items-center gap-1.5"
                  >
                    <span className="font-black">{alert.customerName}:</span>
                    <span className="text-text-secondary">({alert.itemName})</span>
                    <span className="font-mono font-black text-rose-700">
                      Owes {formatMoney(alert.outstandingMinor, currencyCode)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Three Horizontally Aligned Summary Sections (Wrap / stack on mobile) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Section 1: Sales — sales recorded today */}
        <Card shadowSize="md" className="bg-citron-lime-tint border-2 border-blackstone p-4 space-y-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-blackstone font-heading truncate">
              1. Sales
            </span>
            <div className="w-7 h-7 rounded bg-citron-lime border border-blackstone flex items-center justify-center shrink-0">
              <ArrowUpRight className="w-4 h-4 text-blackstone stroke-[2.2]" />
            </div>
          </div>
          <div
            className="text-xl sm:text-2xl font-black font-heading text-blackstone tracking-tight tabular-nums truncate block my-1"
            title={formatMoney(retailTodaySummary.todaySalesMinor, currencyCode)}
          >
            {formatMoney(retailTodaySummary.todaySalesMinor, currencyCode)}
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary pt-1 border-t border-blackstone/10">
            <span>Sales Recorded Today</span>
            <span className="font-mono text-blackstone">{retailTodaySummary.todaySalesCount} sales</span>
          </div>
        </Card>

        {/* Section 2: Operating Expenses — expenses recorded today */}
        <Card shadowSize="md" className="bg-vivid-amber-tint border-2 border-blackstone p-4 space-y-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-blackstone font-heading truncate">
              2. Operating Expenses
            </span>
            <div className="w-7 h-7 rounded bg-vivid-amber border border-blackstone flex items-center justify-center shrink-0">
              <ArrowDownRight className="w-4 h-4 text-blackstone stroke-[2.2]" />
            </div>
          </div>
          <div
            className="text-xl sm:text-2xl font-black font-heading text-blackstone tracking-tight tabular-nums truncate block my-1"
            title={`-${formatMoney(retailTodaySummary.todayExpensesMinor, currencyCode)}`}
          >
            -{formatMoney(retailTodaySummary.todayExpensesMinor, currencyCode)}
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary pt-1 border-t border-blackstone/10">
            <span>Expenses Recorded Today</span>
            <span className="font-mono text-blackstone">{retailTodaySummary.todayExpensesCount} entries</span>
          </div>
        </Card>

        {/* Section 3: Inventory — summary of current inventory with an option to View Inventory */}
        <Card shadowSize="md" className="bg-electric-sky-tint border-2 border-blackstone p-4 space-y-1">
          <div className="flex items-center justify-between gap-2 mb-1">
            <span className="text-xs font-black uppercase tracking-wider text-blackstone font-heading truncate">
              3. Inventory
            </span>
            <div className="w-7 h-7 rounded bg-electric-sky border border-blackstone flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-blackstone stroke-[2.2]" />
            </div>
          </div>
          <div
            className="text-xl sm:text-2xl font-black font-heading text-blackstone tracking-tight tabular-nums truncate block my-1"
            title={formatMoney(totalInventoryValueMinor, currencyCode)}
          >
            {formatMoney(totalInventoryValueMinor, currencyCode)}
          </div>
          <div className="flex items-center justify-between text-[11px] font-bold text-text-secondary pt-1 border-t border-blackstone/10">
            <span>{inventoryItems.length} items cataloged</span>
            <button
              type="button"
              onClick={() => setIsViewInventoryOpen(true)}
              className="inline-flex items-center gap-1.5 font-black text-blackstone hover:underline cursor-pointer bg-white/70 px-2 py-0.5 rounded border border-blackstone/30 neo-press-none"
            >
              <Eye className="w-3.5 h-3.5 text-[#A678B9] stroke-[2.5]" />
              <span>View Inventory</span>
            </button>
          </div>
        </Card>
      </div>

      {/* Note: Sale recording, expense entry, and stock addition controls are strictly in the Ledger. */}
      {onNavigateToLedger && (
        <div className="p-3 bg-canvas border-2 border-dashed border-blackstone/30 rounded-card flex items-center justify-between gap-3">
          <div className="text-xs">
            <p className="font-black text-blackstone">Want to record sales, add stock, or enter expenses?</p>
            <p className="text-[11px] text-text-secondary">Manage transactions and inventory replenishment in the Ledger.</p>
          </div>
          <Button
            size="sm"
            variant="primary"
            className="bg-citron-lime text-blackstone border-2 border-blackstone font-black text-xs shrink-0 shadow-brutal-sm neo-press"
            onClick={onNavigateToLedger}
          >
            Go to Ledger
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* 4. Month Sales & Operating Expenses Ledger: Period Transactions */}
      {/* Kept exactly as it appears, including its date and date controls */}
      <Card shadowSize="md" className="p-4 space-y-3">
        <MonthNavigator />
        <div className="flex items-center justify-between border-b border-blackstone/10 pb-2">
          <h3 className="text-xs font-black uppercase tracking-wider text-blackstone font-heading">
            Period Transactions ({monthTransactions.length})
          </h3>
          <span className="text-[11px] font-mono text-text-secondary">
            {selectedMonth}
          </span>
        </div>

        {monthTransactions.length === 0 ? (
          <div className="p-6 text-center text-xs font-bold text-text-secondary bg-canvas rounded-card border-2 border-dashed border-blackstone/20">
            No retail sales or operating expenses recorded for {selectedMonth}.
          </div>
        ) : (
          <div className="divide-y divide-blackstone/10 border-2 border-blackstone rounded-control overflow-hidden bg-surface">
            {monthTransactions.map((txn) => {
              const isSale = txn.type === 'income';
              const hasDebt = (txn.outstandingBalanceMinor ?? 0) > 0;

              return (
                <div key={txn.id} className="p-3 hover:bg-canvas/50 flex items-center justify-between gap-3">
                  <div className="min-w-0 space-y-0.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${
                          isSale
                            ? 'bg-citron-lime-tint border-citron-lime text-blackstone'
                            : 'bg-vivid-amber-tint border-vivid-amber text-blackstone'
                        }`}
                      >
                        {isSale ? 'Sale' : 'Expense'}
                      </span>
                      <span className="text-xs font-black text-blackstone truncate">
                        {isSale
                          ? txn.itemName || txn.note || 'Retail Sale'
                          : txn.category || 'Operating Expense'}
                      </span>
                      {txn.customerName && (
                        <span className="text-[10px] font-bold text-text-secondary bg-canvas px-1.5 py-0.5 rounded border border-blackstone/20">
                          {txn.customerName}
                        </span>
                      )}
                      {txn.paymentStatus && isSale && (
                        <span
                          className={`text-[9px] font-black uppercase tracking-wider px-1.5 py-0.2 rounded border ${
                            txn.paymentStatus === 'paid'
                              ? 'bg-citron-lime text-blackstone border-blackstone'
                              : txn.paymentStatus === 'partial'
                              ? 'bg-vivid-amber text-blackstone border-blackstone'
                              : 'bg-rose-200 text-rose-900 border-rose-500'
                          }`}
                        >
                          {txn.paymentStatus === 'paid'
                            ? 'Paid'
                            : txn.paymentStatus === 'partial'
                            ? 'Partial'
                            : 'On Credit'}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-[11px] font-bold text-text-secondary flex-wrap">
                      <span>{txn.transactionDate}</span>
                      {isSale && txn.quantitySold && (
                        <>
                          <span>•</span>
                          <span>Qty: {txn.quantitySold}</span>
                        </>
                      )}
                      {hasDebt && (
                        <>
                          <span>•</span>
                          <span className="text-rose-600 font-black">
                            Due: {formatMoney(txn.outstandingBalanceMinor || 0, currencyCode)}
                          </span>
                        </>
                      )}
                      {txn.note && !isSale && (
                        <>
                          <span>•</span>
                          <span className="truncate max-w-[200px]">{txn.note}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-sm font-black font-heading tabular-nums block ${
                        isSale ? 'text-blackstone' : 'text-vivid-amber-dark'
                      }`}
                    >
                      {isSale ? '+' : '-'}
                      {formatMoney(txn.amountMinor, currencyCode)}
                    </span>
                    {isSale && txn.cogsMinor !== undefined && txn.cogsMinor !== null && (
                      <span className="text-[10px] font-bold text-text-secondary block">
                        COGS: {formatMoney(txn.cogsMinor, currencyCode)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* 5. Clear View Inventory Modal (Shows item name, available quantity, purchase price per unit, stock status) */}
      {isViewInventoryOpen && (
        <div className="fixed inset-0 z-modal z-[60] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-blackstone/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150">
          <Card
            shadowSize="lg"
            className="w-full max-w-xl h-[90dvh] sm:h-auto max-h-[90dvh] sm:max-h-[85vh] flex flex-col rounded-b-none sm:rounded-card border-x-0 sm:border-x-2 border-b-0 sm:border-b-2 border-t-2 border-blackstone bg-surface overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b-2 border-blackstone bg-canvas">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-control bg-[#A678B9] border border-blackstone flex items-center justify-center">
                  <Package className="w-4 h-4 text-white stroke-[2.2]" />
                </div>
                <div>
                  <h2 className="text-base font-black font-heading text-blackstone leading-none">
                    Inventory Catalog
                  </h2>
                  <p className="text-[11px] font-bold text-text-secondary mt-0.5">
                    Available quantities, purchase prices, and stock statuses
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsViewInventoryOpen(false)}
                className="w-8 h-8 rounded-control border border-blackstone bg-surface hover:bg-canvas flex items-center justify-center text-blackstone neo-press cursor-pointer"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Search and Filters */}
            <div className="p-3 border-b border-blackstone/10 bg-surface space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={inventorySearch}
                  onChange={(e) => setInventorySearch(e.target.value)}
                  placeholder="Search inventory items..."
                  className="w-full h-9 pl-9 pr-3 text-xs font-bold border-2 border-blackstone rounded-control bg-canvas focus:outline-hidden focus:border-electric-sky"
                />
              </div>

              <div className="flex gap-1 overflow-x-auto pb-0.5">
                {(['all', 'in_stock', 'low_stock', 'empty'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setStatusFilter(filter)}
                    className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-control border whitespace-nowrap cursor-pointer transition-colors ${
                      statusFilter === filter
                        ? 'bg-blackstone text-surface border-blackstone'
                        : 'bg-surface text-blackstone/70 border-blackstone/20 hover:border-blackstone'
                    }`}
                  >
                    {filter === 'all'
                      ? 'All'
                      : filter === 'in_stock'
                      ? 'In Stock'
                      : filter === 'low_stock'
                      ? 'Running Low'
                      : 'Empty'}
                  </button>
                ))}
              </div>
            </div>

            {/* Inventory List */}
            <div className="p-3 overflow-y-auto space-y-2 max-h-[60vh]">
              {filteredItems.length === 0 ? (
                <div className="p-6 text-center text-xs font-bold text-text-secondary bg-canvas rounded-card border-2 border-dashed border-blackstone/20">
                  {inventoryItems.length === 0
                    ? 'No inventory items cataloged yet.'
                    : 'No items match your search or filter.'}
                </div>
              ) : (
                <div className="divide-y divide-blackstone/10 border-2 border-blackstone rounded-control overflow-hidden bg-surface">
                  {filteredItems.map((item) => {
                    const isLow = item.status === 'low_stock';
                    const isEmpty = item.status === 'empty';

                    return (
                      <div
                        key={item.id}
                        className="p-3 hover:bg-canvas/40 transition-colors flex items-center justify-between gap-3"
                      >
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-heading font-black text-sm text-blackstone truncate">
                              {item.name}
                            </span>
                            <span
                              className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                                isEmpty
                                  ? 'bg-rose-100 border-rose-400 text-rose-800'
                                  : isLow
                                  ? 'bg-amber-100 border-amber-400 text-amber-900'
                                  : 'bg-citron-lime-tint border-citron-lime text-blackstone'
                              }`}
                            >
                              {isEmpty ? 'Empty' : isLow ? 'Running Low' : 'In stock'}
                            </span>
                          </div>

                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-secondary font-bold">
                            <span>
                              Available Qty:{' '}
                              <strong className="text-blackstone font-mono">{item.currentQuantity} units</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Purchase Price / Unit:{' '}
                              <strong className="text-blackstone">{formatMoney(item.avgPurchasePriceMinor, currencyCode)}</strong>
                            </span>
                            <span>•</span>
                            <span>
                              Total Valuation:{' '}
                              <strong className="text-blackstone">
                                {formatMoney(item.currentQuantity * item.avgPurchasePriceMinor, currencyCode)}
                              </strong>
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 border-t-2 border-blackstone bg-canvas flex items-center justify-between">
              <span className="text-[11px] font-bold text-text-secondary">
                {filteredItems.length} of {inventoryItems.length} items shown
              </span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsViewInventoryOpen(false)}
                className="text-xs font-black"
              >
                Close
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
