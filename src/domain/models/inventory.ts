import { Transaction } from './transaction';

export type StockStatus = 'in_stock' | 'low_stock' | 'empty';

export interface InventoryItem {
  id: string;
  bookId: string;
  businessId?: string;
  name: string;
  currentQuantity: number;
  avgPurchasePriceMinor: number; // Weighted average cost per unit in minor units (e.g. cents)
  status: StockStatus;
  createdAt: string;
  updatedAt: string;
}

/**
 * Computes status based on customizable low-stock threshold:
 * - In stock when quantity is above threshold (> threshold)
 * - Running low when quantity is 1 to threshold (1 <= Q <= threshold)
 * - Empty when quantity is 0 or less (Q <= 0)
 */
export function computeStockStatus(quantity: number, lowStockThreshold: number = 10): StockStatus {
  if (quantity <= 0) return 'empty';
  if (quantity <= lowStockThreshold) return 'low_stock';
  return 'in_stock';
}

/**
 * Calculates updated weighted average purchase cost per unit upon stock replenishment:
 * Q_total = Q_current + Q_added
 * Cost_avg = (Q_current * Cost_current + Q_added * Price_added) / Q_total
 */
export function calculateWeightedAverageCost(
  currentQuantity: number,
  currentAvgCostMinor: number,
  addedQuantity: number,
  purchasePriceMinor: number
): number {
  if (addedQuantity <= 0) return currentAvgCostMinor;
  if (currentQuantity <= 0) return purchasePriceMinor;

  const totalCost = (currentQuantity * currentAvgCostMinor) + (addedQuantity * purchasePriceMinor);
  const totalQuantity = currentQuantity + addedQuantity;
  return Math.round(totalCost / totalQuantity);
}

export interface RetailTodaySummary {
  todaySalesMinor: number;
  todayExpensesMinor: number;
  todayNetMinor: number;
  todaySalesCount: number;
  todayExpensesCount: number;
}

export function calculateRetailTodaySummary(todayDate: string, transactions: Transaction[]): RetailTodaySummary {
  let todaySalesMinor = 0;
  let todayExpensesMinor = 0;
  let todaySalesCount = 0;
  let todayExpensesCount = 0;

  for (const t of transactions) {
    if (t.transactionDate === todayDate) {
      if (t.type === 'income') {
        todaySalesMinor += t.amountMinor;
        todaySalesCount++;
      } else {
        todayExpensesMinor += t.amountMinor;
        todayExpensesCount++;
      }
    }
  }

  return {
    todaySalesMinor,
    todayExpensesMinor,
    todayNetMinor: todaySalesMinor - todayExpensesMinor,
    todaySalesCount,
    todayExpensesCount,
  };
}

export interface RetailPeriodStatement {
  salesRevenueMinor: number;
  cogsMinor: number;
  grossProfitMinor: number;
  operatingExpensesMinor: number;
  netProfitMinor: number;
}

export function calculateRetailPeriodStatement(transactions: Transaction[]): RetailPeriodStatement {
  let salesRevenueMinor = 0;
  let cogsMinor = 0;
  let operatingExpensesMinor = 0;

  for (const t of transactions) {
    if (t.type === 'income') {
      salesRevenueMinor += t.amountMinor;
      cogsMinor += (t.cogsMinor || 0);
    } else {
      operatingExpensesMinor += t.amountMinor;
    }
  }

  const grossProfitMinor = salesRevenueMinor - cogsMinor;
  const netProfitMinor = grossProfitMinor - operatingExpensesMinor;

  return {
    salesRevenueMinor,
    cogsMinor,
    grossProfitMinor,
    operatingExpensesMinor,
    netProfitMinor,
  };
}

export interface ItemProfitability {
  itemId: string;
  itemName: string;
  quantitySold: number;
  salesRevenueMinor: number;
  cogsMinor: number;
  grossProfitMinor: number;
  grossMarginPercent: number;
  currentStock: number;
  unitAvgCostMinor: number;
}

export function calculateItemProfitability(
  items: InventoryItem[],
  transactions: Transaction[]
): ItemProfitability[] {
  const itemMap = new Map<string, {
    itemName: string;
    quantitySold: number;
    salesRevenueMinor: number;
    cogsMinor: number;
    currentStock: number;
    unitAvgCostMinor: number;
  }>();

  // Initialize with all known inventory items
  for (const item of items) {
    itemMap.set(item.id, {
      itemName: item.name,
      quantitySold: 0,
      salesRevenueMinor: 0,
      cogsMinor: 0,
      currentStock: item.currentQuantity,
      unitAvgCostMinor: item.avgPurchasePriceMinor,
    });
  }

  // Accumulate from sales in period
  for (const t of transactions) {
    if (t.type === 'income' && t.itemId) {
      let entry = itemMap.get(t.itemId);
      if (!entry) {
        entry = {
          itemName: t.itemName || 'Item',
          quantitySold: 0,
          salesRevenueMinor: 0,
          cogsMinor: 0,
          currentStock: 0,
          unitAvgCostMinor: t.unitCostMinor || 0,
        };
        itemMap.set(t.itemId, entry);
      }
      entry.quantitySold += (t.quantitySold || 1);
      entry.salesRevenueMinor += t.amountMinor;
      entry.cogsMinor += (t.cogsMinor || 0);
    }
  }

  return Array.from(itemMap.entries()).map(([itemId, data]) => {
    const grossProfitMinor = data.salesRevenueMinor - data.cogsMinor;
    const grossMarginPercent = data.salesRevenueMinor > 0 
      ? Math.round((grossProfitMinor / data.salesRevenueMinor) * 100) 
      : 0;

    return {
      itemId,
      itemName: data.itemName,
      quantitySold: data.quantitySold,
      salesRevenueMinor: data.salesRevenueMinor,
      cogsMinor: data.cogsMinor,
      grossProfitMinor,
      grossMarginPercent,
      currentStock: data.currentStock,
      unitAvgCostMinor: data.unitAvgCostMinor,
    };
  });
}

export interface BestSellingItem {
  rank: number;
  itemId: string;
  itemName: string;
  quantitySold: number;
  salesRevenueMinor: number;
  cogsMinor: number;
  grossProfitMinor: number;
  grossMarginPercent: number;
}

export function getBestSellingItems(
  items: InventoryItem[],
  transactions: Transaction[]
): BestSellingItem[] {
  const profitability = calculateItemProfitability(items, transactions);
  
  // Filter for items that actually sold during period and sort descending by quantity
  const sorted = profitability
    .filter((p) => p.quantitySold > 0)
    .sort((a, b) => b.quantitySold - a.quantitySold);

  return sorted.map((p, idx) => ({
    rank: idx + 1,
    itemId: p.itemId,
    itemName: p.itemName,
    quantitySold: p.quantitySold,
    salesRevenueMinor: p.salesRevenueMinor,
    cogsMinor: p.cogsMinor,
    grossProfitMinor: p.grossProfitMinor,
    grossMarginPercent: p.grossMarginPercent,
  }));
}

export interface InventoryAlert {
  itemId: string;
  itemName: string;
  currentQuantity: number;
  status: 'low_stock' | 'empty';
  message: string;
}

export function getInventoryAlerts(items: InventoryItem[], lowStockThreshold: number = 10): InventoryAlert[] {
  const alerts: InventoryAlert[] = [];

  for (const item of items) {
    if (item.currentQuantity <= 0) {
      alerts.push({
        itemId: item.id,
        itemName: item.name,
        currentQuantity: 0,
        status: 'empty',
        message: `Out of stock: ${item.name} has 0 units remaining.`,
      });
    } else if (item.currentQuantity <= lowStockThreshold) {
      alerts.push({
        itemId: item.id,
        itemName: item.name,
        currentQuantity: item.currentQuantity,
        status: 'low_stock',
        message: `Running low: ${item.name} has only ${item.currentQuantity} units left.`,
      });
    }
  }

  // Order with empty (urgent) first, then low stock
  return alerts.sort((a, b) => {
    if (a.status === 'empty' && b.status !== 'empty') return -1;
    if (b.status === 'empty' && a.status !== 'empty') return 1;
    return a.currentQuantity - b.currentQuantity;
  });
}

export interface DebtorRecord {
  transactionId: string;
  customerName: string;
  itemPurchased: string;
  quantity: number;
  totalSaleMinor: number;
  amountPaidMinor: number;
  outstandingAmountMinor: number;
  paymentStatus: 'partial' | 'credit';
  transactionDate: string;
  paymentMethod?: string;
}

export function getDebtorsReport(transactions: Transaction[]): DebtorRecord[] {
  const debtors: DebtorRecord[] = [];

  for (const t of transactions) {
    if (t.type === 'income' && t.itemId && (t.outstandingBalanceMinor || 0) > 0) {
      debtors.push({
        transactionId: t.id,
        customerName: t.customerName || 'Customer',
        itemPurchased: t.itemName || 'Item',
        quantity: t.quantitySold || 1,
        totalSaleMinor: t.amountMinor,
        amountPaidMinor: t.amountPaidMinor || 0,
        outstandingAmountMinor: t.outstandingBalanceMinor || (t.amountMinor - (t.amountPaidMinor || 0)),
        paymentStatus: (t.paymentStatus as 'partial' | 'credit') || 'credit',
        transactionDate: t.transactionDate,
        paymentMethod: t.paymentMethod || undefined,
      });
    }
  }

  return debtors.sort((a, b) => b.outstandingAmountMinor - a.outstandingAmountMinor);
}

export interface DebtorAlert {
  transactionId: string;
  customerName: string;
  itemName: string;
  outstandingMinor: number;
  status: 'partial' | 'credit';
}

export function getDebtorAlerts(transactions: Transaction[]): DebtorAlert[] {
  return getDebtorsReport(transactions).map((d) => ({
    transactionId: d.transactionId,
    customerName: d.customerName,
    itemName: d.itemPurchased,
    outstandingMinor: d.outstandingAmountMinor,
    status: d.paymentStatus,
  }));
}
