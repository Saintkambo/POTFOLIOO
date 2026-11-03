import { Book } from './book';
import { Transaction } from './transaction';
import { InventoryItem } from './inventory';

export const DEMO_RETAIL_BOOK: Book = {
  id: 'demo-retail-business-kariakoo',
  name: 'Kariakoo Wholesale Traders (Demo)',
  currencyCode: 'TZS',
  category: 'retail',
  businessId: 'demo-retail-business-kariakoo',
  userId: 'demo-user-id',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  schemaVersion: 4,
  lowStockThreshold: 10,
};

export const DEMO_RENTAL_BOOK: Book = {
  id: 'demo-rental-property-mikocheni',
  name: 'Mikocheni Palm Apartments (Demo)',
  currencyCode: 'TZS',
  category: 'rental',
  businessId: 'demo-rental-property-mikocheni',
  userId: 'demo-user-id',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  schemaVersion: 4,
  lowStockThreshold: 10,
};

export function getInitialDemoInventory(): InventoryItem[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'demo-item-1',
      bookId: DEMO_RETAIL_BOOK.id,
      businessId: DEMO_RETAIL_BOOK.id,
      name: 'Sembe Maize Flour 25kg (Bakhresa)',
      currentQuantity: 42,
      avgPurchasePriceMinor: 3800000, // TSh 38,000
      status: 'in_stock',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-item-2',
      bookId: DEMO_RETAIL_BOOK.id,
      businessId: DEMO_RETAIL_BOOK.id,
      name: 'Cooking Oil 5L (Korie Pure)',
      currentQuantity: 18,
      avgPurchasePriceMinor: 2850000, // TSh 28,500
      status: 'in_stock',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-item-3',
      bookId: DEMO_RETAIL_BOOK.id,
      businessId: DEMO_RETAIL_BOOK.id,
      name: 'White Sugar 50kg (Kilombero)',
      currentQuantity: 5, // Running low!
      avgPurchasePriceMinor: 14000000, // TSh 140,000
      status: 'low_stock',
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'demo-item-4',
      bookId: DEMO_RETAIL_BOOK.id,
      businessId: DEMO_RETAIL_BOOK.id,
      name: 'Kyela Super Aromatic Rice 25kg',
      currentQuantity: 0, // Out of stock!
      avgPurchasePriceMinor: 6500000, // TSh 65,000
      status: 'empty',
      createdAt: now,
      updatedAt: now,
    },
  ];
}

export function getInitialDemoTransactions(): Transaction[] {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const yesterdayDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

  return [
    {
      id: 'demo-txn-1',
      bookId: DEMO_RETAIL_BOOK.id,
      businessId: DEMO_RETAIL_BOOK.id,
      type: 'income',
      amountMinor: 21500000, // TSh 215,000
      transactionDate: todayStr,
      category: 'Inventory Sale',
      note: '5 bags Sembe Flour sale (Paid via M-Pesa)',
      itemId: 'demo-item-1',
      itemName: 'Sembe Maize Flour 25kg (Bakhresa)',
      quantitySold: 5,
      unitPriceMinor: 4300000,
      unitCostMinor: 3800000,
      cogsMinor: 19000000,
      paymentStatus: 'paid',
      paymentMethod: 'mobile',
      amountPaidMinor: 21500000,
      outstandingBalanceMinor: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-txn-2',
      bookId: DEMO_RETAIL_BOOK.id,
      businessId: DEMO_RETAIL_BOOK.id,
      type: 'income',
      amountMinor: 9600000, // TSh 96,000
      transactionDate: todayStr,
      category: 'Inventory Sale',
      note: '3 cans Cooking Oil 5L (Cash payment)',
      itemId: 'demo-item-2',
      itemName: 'Cooking Oil 5L (Korie Pure)',
      quantitySold: 3,
      unitPriceMinor: 3200000,
      unitCostMinor: 2850000,
      cogsMinor: 8550000,
      paymentStatus: 'paid',
      paymentMethod: 'cash',
      amountPaidMinor: 9600000,
      outstandingBalanceMinor: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-txn-3',
      bookId: DEMO_RETAIL_BOOK.id,
      businessId: DEMO_RETAIL_BOOK.id,
      type: 'expense',
      amountMinor: 3500000, // TSh 35,000
      transactionDate: todayStr,
      category: 'Utilities',
      note: 'TANESCO LUKU shop electricity tokens',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-txn-4',
      bookId: DEMO_RETAIL_BOOK.id,
      businessId: DEMO_RETAIL_BOOK.id,
      type: 'expense',
      amountMinor: 2500000, // TSh 25,000
      transactionDate: yesterdayStr,
      category: 'Transport',
      note: 'Delivery tricycle fuel & parking fees',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: 'demo-txn-5',
      bookId: DEMO_RETAIL_BOOK.id,
      businessId: DEMO_RETAIL_BOOK.id,
      type: 'income',
      amountMinor: 15500000, // TSh 155,000 total (TSh 100,000 paid, TSh 55,000 debtor balance)
      transactionDate: yesterdayStr,
      category: 'Inventory Sale',
      note: 'Sugar 50kg sold to Mama Grace Cafe',
      itemId: 'demo-item-3',
      itemName: 'White Sugar 50kg (Kilombero)',
      quantitySold: 1,
      unitPriceMinor: 15500000,
      unitCostMinor: 14000000,
      cogsMinor: 14000000,
      paymentStatus: 'partial',
      paymentMethod: 'cash',
      amountPaidMinor: 10000000,
      outstandingBalanceMinor: 5500000,
      customerName: 'Mama Grace Cafe',
      phoneNumber: '+255 754 123 456',
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    },
  ];
}
