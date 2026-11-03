import React from 'react';
import { useBook } from '../context/BookContext';
import { MonthNavigator } from '../components/molecules/MonthNavigator';
import { formatMoney } from '../../domain/money';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import {
  Download,
  PieChart,
  TrendingUp,
  TrendingDown,
  FileSpreadsheet,
  FileText,
  Award,
  BarChart3,
  User,
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const {
    summary,
    book,
    selectedMonth,
    isRetailBusiness,
    retailPeriodStatement,
    bestSellersList,
    debtorList,
    downloadCSV,
    downloadExcel,
    downloadPDF,
  } = useBook();
  const currencyCode = book?.currencyCode || 'TZS';

  // -------------------------------------------------------------
  // RETAIL / WHOLESALE BUSINESS REPORTS
  // -------------------------------------------------------------
  if (isRetailBusiness) {
    const {
      salesRevenueMinor,
      cogsMinor,
      grossProfitMinor,
      operatingExpensesMinor,
      netProfitMinor,
    } = retailPeriodStatement;

    const isNetProfitable = netProfitMinor >= 0;
    const grossMarginPercent = salesRevenueMinor > 0
      ? Math.round((grossProfitMinor / salesRevenueMinor) * 100)
      : 0;

    return (
      <div className="space-y-4 pb-8">
        {/* Month Navigator */}
        <MonthNavigator />

        {/* 1. Retail Income Statement */}
        <Card shadowSize="lg" className="space-y-3 p-4">
          <div className="flex items-center justify-between border-b border-blackstone/10 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded bg-citron-lime border border-blackstone flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-blackstone stroke-[2.2]" />
              </div>
              <h2 className="text-sm font-black font-heading text-blackstone uppercase tracking-wider">
                Income Statement
              </h2>
            </div>
            <span className="text-[11px] font-mono font-bold bg-canvas border border-blackstone/20 px-2 py-0.5 rounded text-blackstone">
              {selectedMonth}
            </span>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* Sales Revenue */}
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-blackstone">
                <span className="w-2.5 h-2.5 rounded bg-citron-lime border border-blackstone" />
                Sales Revenue
              </span>
              <span className="font-extrabold text-sm tabular-nums text-blackstone">
                {formatMoney(salesRevenueMinor, currencyCode)}
              </span>
            </div>

            {/* Cost of Goods Sold (COGS) */}
            <div className="flex items-center justify-between font-bold">
              <span className="flex items-center gap-1.5 text-blackstone">
                <span className="w-2.5 h-2.5 rounded bg-electric-sky border border-blackstone" />
                Cost of Goods Sold (COGS)
              </span>
              <span className="font-extrabold text-sm tabular-nums text-blackstone">
                -{formatMoney(cogsMinor, currencyCode)}
              </span>
            </div>

            {/* Gross Profit */}
            <div className="pt-2 border-t border-blackstone/20 flex items-center justify-between font-black text-xs bg-canvas/60 p-2 rounded-control">
              <span className="flex items-center gap-1.5 text-blackstone uppercase tracking-wider font-heading">
                <span className="w-2.5 h-2.5 rounded bg-[#A678B9] border border-blackstone shrink-0" />
                Gross Profit (Sales - COGS)
              </span>
              <div className="text-right">
                <span className="tabular-nums text-blackstone block text-sm">
                  {formatMoney(grossProfitMinor, currencyCode)}
                </span>
                <span className="text-[10px] font-bold text-[#A678B9] block">
                  Margin: {grossMarginPercent}%
                </span>
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="flex items-center justify-between font-bold pt-1">
              <span className="flex items-center gap-1.5 text-blackstone">
                <span className="w-2.5 h-2.5 rounded bg-vivid-amber border border-blackstone" />
                Operating Expenses
              </span>
              <span className="font-extrabold text-sm tabular-nums text-vivid-amber-dark">
                -{formatMoney(operatingExpensesMinor, currencyCode)}
              </span>
            </div>

            {/* Net Profit */}
            <div className={`pt-2.5 border-t-2 border-blackstone flex items-center justify-between font-black text-sm p-2 rounded-control ${
              isNetProfitable ? 'bg-citron-lime-tint' : 'bg-rose-50'
            }`}>
              <span className="flex items-center gap-1.5 text-blackstone font-heading uppercase tracking-wider">
                {isNetProfitable ? (
                  <TrendingUp className="w-4 h-4 text-blackstone" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-rose-700" />
                )}
                Net Profit (Gross - Expenses)
              </span>
              <span className={`tabular-nums font-black text-base ${
                isNetProfitable ? 'text-blackstone' : 'text-rose-700'
              }`}>
                {isNetProfitable ? '+' : '-'}
                {formatMoney(Math.abs(netProfitMinor), currencyCode)}
              </span>
            </div>
          </div>

          <p className="text-[10px] text-text-secondary border-t border-blackstone/10 pt-2 font-medium">
            * Note: Inventory purchases are capitalized in stock at weighted average cost and recognized as COGS only when the items are sold.
          </p>
        </Card>

        {/* 2. Best-Selling Items Summary (Ranked by Quantity Sold) */}
        <Card shadowSize="md" className="space-y-3 p-4">
          <div className="flex items-center justify-between border-b border-blackstone/10 pb-2">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-blackstone" />
              <h3 className="text-xs font-black font-heading text-blackstone uppercase tracking-wider">
                Best-Selling Items
              </h3>
            </div>
            <span className="text-[11px] font-bold text-text-secondary">
              Ranked by quantity sold
            </span>
          </div>

          {bestSellersList.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-4 font-bold bg-canvas rounded-card border-2 border-dashed border-blackstone/20">
              No sales recorded for this period yet.
            </p>
          ) : (
            <div className="divide-y divide-blackstone/10 border-2 border-blackstone rounded-control overflow-hidden bg-surface">
              {bestSellersList.map((item) => (
                <div key={item.itemId} className="p-2.5 flex items-center justify-between gap-2 hover:bg-canvas/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-full bg-citron-lime border border-blackstone text-blackstone font-black text-xs flex items-center justify-center shrink-0 font-mono">
                      #{item.rank}
                    </span>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-blackstone truncate font-heading">
                        {item.itemName}
                      </p>
                      <p className="text-[11px] font-bold text-text-secondary">
                        {item.quantitySold} units sold
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs font-black text-blackstone block tabular-nums">
                      {formatMoney(item.salesRevenueMinor, currencyCode)}
                    </span>
                    <span className="text-[10px] font-extrabold text-[#A678B9] flex items-center justify-end gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#A678B9] inline-block" />
                      Gross Profit: {formatMoney(item.grossProfitMinor, currencyCode)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* 3. Debtor Report (Customers with Outstanding Balances) */}
        <Card shadowSize="md" className="space-y-3 p-4">
          <div className="flex items-center justify-between border-b border-blackstone/10 pb-2">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-blackstone" />
              <h3 className="text-xs font-black font-heading text-blackstone uppercase tracking-wider">
                Debtor Report
              </h3>
            </div>
            <span className="text-[11px] font-bold text-text-secondary">
              {debtorList.length} debtor{debtorList.length === 1 ? '' : 's'}
            </span>
          </div>

          {debtorList.length === 0 ? (
            <p className="text-xs text-text-secondary text-center py-4 font-bold bg-canvas rounded-card border-2 border-dashed border-blackstone/20">
              No outstanding customer balances for this period. All sales are paid in full!
            </p>
          ) : (
            <div className="divide-y divide-blackstone/10 border-2 border-blackstone rounded-control overflow-hidden bg-surface">
              {debtorList.map((debtor) => (
                <div key={debtor.transactionId} className="p-3 hover:bg-canvas/40 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-heading font-black text-xs text-blackstone">
                      {debtor.customerName}
                    </span>
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                        debtor.paymentStatus === 'credit'
                          ? 'bg-rose-100 border-rose-400 text-rose-800'
                          : 'bg-amber-100 border-amber-400 text-amber-900'
                      }`}
                    >
                      {debtor.paymentStatus === 'credit' ? 'On credit' : 'Partially paid'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-bold text-text-secondary">
                    <div>
                      <span>Item: </span>
                      <span className="text-blackstone font-black">
                        {debtor.quantity}x {debtor.itemPurchased}
                      </span>
                    </div>
                    <div>
                      <span>Total Sale: </span>
                      <span className="text-blackstone font-black font-mono">
                        {formatMoney(debtor.totalSaleMinor, currencyCode)}
                      </span>
                    </div>
                    <div>
                      <span>Paid: </span>
                      <span className="text-emerald-700 font-black font-mono">
                        {formatMoney(debtor.amountPaidMinor, currencyCode)}
                      </span>
                    </div>
                    <div>
                      <span>Outstanding: </span>
                      <span className="text-rose-600 font-black font-mono">
                        {formatMoney(debtor.outstandingAmountMinor, currencyCode)}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Export Actions */}
        <div className="space-y-2 pt-1">
          <Button
            variant="primary"
            size="md"
            className="w-full text-xs font-black bg-citron-lime text-blackstone border-2 border-blackstone shadow-brutal neo-press"
            onClick={downloadExcel}
          >
            <FileSpreadsheet className="w-4 h-4 mr-2 text-blackstone" />
            Download Retail Excel Workbook (.xlsx)
          </Button>

          <Button
            variant="secondary"
            size="md"
            className="w-full text-xs font-bold border-2 border-blackstone neo-press"
            onClick={downloadPDF}
          >
            <FileText className="w-4 h-4 mr-2 text-blackstone" />
            Download Retail Report as PDF (.pdf)
          </Button>
        </div>
      </div>
    );
  }

  // -------------------------------------------------------------
  // STANDARD / OTHER BUSINESS REPORTS
  // -------------------------------------------------------------
  const totalFlow = summary.totalIncomeMinor + summary.totalExpenseMinor;
  const incomePercent = totalFlow > 0 ? Math.round((summary.totalIncomeMinor / totalFlow) * 100) : 50;
  const expensePercent = 100 - incomePercent;

  return (
    <div className="space-y-4 pb-8">
      {/* Month Navigator */}
      <MonthNavigator />

      {/* Cash Flow Card */}
      <Card shadowSize="lg" className="space-y-3">
        <div className="flex items-center justify-between border-b border-blackstone/10 pb-2">
          <h2 className="text-sm font-bold font-heading text-blackstone uppercase tracking-wider">
            Monthly Cash Flow
          </h2>
          <span className="text-xs font-bold text-text-secondary">
            {summary.transactionCount} transactions
          </span>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5 text-blackstone">
              <span className="w-2.5 h-2.5 rounded bg-citron-lime border border-blackstone" />
              Total Inflows (Income)
            </span>
            <span className="font-extrabold text-sm tabular-nums text-blackstone">
              {formatMoney(summary.totalIncomeMinor, currencyCode)}
            </span>
          </div>

          <div className="flex items-center justify-between font-bold">
            <span className="flex items-center gap-1.5 text-blackstone">
              <span className="w-2.5 h-2.5 rounded bg-vivid-amber border border-blackstone" />
              Total Outflows (Expenses)
            </span>
            <span className="font-extrabold text-sm tabular-nums text-blackstone">
              {formatMoney(summary.totalExpenseMinor, currencyCode)}
            </span>
          </div>

          <div className="pt-2 border-t-2 border-blackstone flex items-center justify-between font-black text-sm">
            <span className="flex items-center gap-1">
              {summary.isProfit ? (
                <TrendingUp className="w-3.5 h-3.5 text-citron-lime-dark" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5 text-vivid-amber-dark" />
              )}
              Net Result
            </span>
            <span className="tabular-nums">
              {summary.netProfitMinor >= 0 ? '+' : '-'}
              {formatMoney(Math.abs(summary.netProfitMinor), currencyCode)}
            </span>
          </div>
        </div>

        {/* Proportional Cash Flow Bar */}
        {totalFlow > 0 && (
          <div className="pt-2">
            <div className="h-6 w-full rounded-control border-2 border-blackstone overflow-hidden flex bg-canvas shadow-brutal-sm">
              <div
                style={{ width: `${incomePercent}%` }}
                className="bg-citron-lime h-full flex items-center justify-center text-[10px] font-black text-blackstone border-r border-blackstone select-none"
              >
                {incomePercent > 12 && `${incomePercent}%`}
              </div>
              <div
                style={{ width: `${expensePercent}%` }}
                className="bg-vivid-amber h-full flex items-center justify-center text-[10px] font-black text-blackstone select-none"
              >
                {expensePercent > 12 && `${expensePercent}%`}
              </div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-text-secondary mt-1">
              <span>Income ({incomePercent}%)</span>
              <span>Expenses ({expensePercent}%)</span>
            </div>
          </div>
        )}
      </Card>

      {/* Top Expense Categories Breakdown */}
      <Card shadowSize="md" className="space-y-3">
        <div className="flex items-center gap-2 border-b border-blackstone/10 pb-2">
          <PieChart className="w-3.5 h-3.5 text-blackstone" />
          <h2 className="text-sm font-bold font-heading text-blackstone uppercase tracking-wider">
            Expenses by Category
          </h2>
        </div>

        {summary.categories.length > 0 ? (
          <div className="space-y-2.5">
            {summary.categories.map(cat => (
              <div key={cat.category} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-blackstone">
                  <span>{cat.category}</span>
                  <span className="tabular-nums font-extrabold">
                    {formatMoney(cat.totalMinor, currencyCode)} ({cat.percentage}%)
                  </span>
                </div>
                <div className="h-2.5 w-full bg-surface-muted rounded-full border border-blackstone/30 overflow-hidden">
                  <div
                    style={{ width: `${cat.percentage}%` }}
                    className="h-full bg-vivid-amber border-r border-blackstone"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-text-secondary text-center py-4 font-medium">
            No expense records categorized this month.
          </p>
        )}
      </Card>

      {/* Export Actions */}
      <div className="space-y-2">
        <Button
          variant="primary"
          size="md"
          className="w-full text-xs font-bold bg-citron-lime text-blackstone hover:bg-citron-lime-dark"
          onClick={downloadExcel}
        >
          <FileSpreadsheet className="w-3.5 h-3.5 mr-2 text-blackstone" />
          Download Excel Workbook (.xlsx)
        </Button>

        <Button
          variant="secondary"
          size="md"
          className="w-full text-xs font-bold"
          onClick={downloadCSV}
        >
          <Download className="w-3.5 h-3.5 mr-2" />
          Download Month Records as CSV
        </Button>
      </div>
    </div>
  );
};
