import assert from 'node:assert';
import { generateExcelWorkbook } from '../../src/infrastructure/export/excel-export-service.ts';

console.log('🧪 Starting Excel Export (.xlsx) Tests...\n');

// 1. Test Rental Business Export
console.log('1. Testing Rental Business Workbook Export...');
const rentalBook = {
  id: 'rental-101',
  name: 'Mwenge Apartments',
  currencyCode: 'TZS',
  category: 'rental',
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
};

const rentalTransactions = [
  {
    id: 't-1',
    bookId: 'rental-101',
    type: 'income',
    amountMinor: 60000000, // 600,000 TZS
    transactionDate: '2026-11-01',
    category: null,
    note: 'Bank transfer',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
    tenantName: 'Baraka Ali',
    roomNumber: '3A',
    phoneNumber: '0754112233',
    chargePerRoom: 20000000, // 200,000 TZS
    monthsPaid: 3,
    dueDate: '2027-02-01',
  },
  {
    id: 't-2',
    bookId: 'rental-101',
    type: 'expense',
    amountMinor: 15000000, // 150,000 TZS
    transactionDate: '2026-11-02',
    category: 'Renovations',
    note: 'Wall painting & plumbing fixtures',
    createdAt: '2026-11-02T00:00:00Z',
    updatedAt: '2026-11-02T00:00:00Z',
  },
];

const rentalExport = generateExcelWorkbook(rentalBook, rentalTransactions);
assert(rentalExport.filename.endsWith('.xlsx'), 'Filename must end with .xlsx');
assert(rentalExport.content.length > 1000, 'Content must be a non-empty binary zip archive');

// Verify ZIP header: 0x04034b50 ('PK\x03\x04')
const view = new DataView(rentalExport.content.buffer, rentalExport.content.byteOffset, rentalExport.content.byteLength);
assert.strictEqual(view.getUint32(0, true), 0x04034b50, 'Must have standard PKZIP signature');

// Convert bytes to string to inspect OpenXML sheets
const contentString = new TextDecoder('utf-8', { fatal: false }).decode(rentalExport.content);
assert(contentString.includes('Rent Ledger'), 'Must contain Rent Ledger worksheet');
assert(contentString.includes('Property Expenses'), 'Must contain Property Expenses worksheet');

// Check required rental columns
const requiredRentalCols = [
  'Tenant Name',
  'Phone Number',
  'Date Paid',
  'Amount Paid',
  'Date Due',
  'Price per Room',
  'Months Paid'
];
for (const col of requiredRentalCols) {
  assert(contentString.includes(col), `Must include required column: ${col}`);
}

// Check tenant data exported as values
assert(contentString.includes('Baraka Ali'), 'Must contain tenant name');
assert(contentString.includes('0754112233'), 'Must contain tenant phone');
assert(contentString.includes('2026-11-01'), 'Must contain payment date');
assert(contentString.includes('2027-02-01'), 'Must contain due date');
assert(contentString.includes('<v>600000</v>'), 'Amount Paid must be numeric value 600000');
assert(contentString.includes('<v>200000</v>'), 'Price per Room must be numeric value 200000');
assert(contentString.includes('<v>3</v>'), 'Months Paid must be numeric value 3');
console.log('   ✅ Rental Business Workbook validated successfully.');

// 2. Test Other Business Type Export (Daily Income, Daily Expenses, Daily Totals)
console.log('\n2. Testing Other Business Type Workbook Export...');
const storeBook = {
  id: 'store-202',
  name: 'Safari Mini Supermarket',
  currencyCode: 'TZS',
  category: 'other',
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
};

const storeTransactions = [
  // Day 1: 2026-11-01 (Income: 300,000 + 200,000 = 500,000; Expense: 100,000)
  {
    id: 'st-1',
    bookId: 'store-202',
    type: 'income',
    amountMinor: 30000000,
    transactionDate: '2026-11-01',
    category: 'Sales',
    note: 'Morning retail sales',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'st-2',
    bookId: 'store-202',
    type: 'income',
    amountMinor: 20000000,
    transactionDate: '2026-11-01',
    category: 'Wholesale',
    note: 'Bulk beverage sale',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'st-3',
    bookId: 'store-202',
    type: 'expense',
    amountMinor: 10000000,
    transactionDate: '2026-11-01',
    category: 'Inventory',
    note: 'Restock milk and bread',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
  // Day 2: 2026-11-02 (Income: 450,000; Expense: 50,000)
  {
    id: 'st-4',
    bookId: 'store-202',
    type: 'income',
    amountMinor: 45000000,
    transactionDate: '2026-11-02',
    category: 'Sales',
    note: 'Afternoon store sales',
    createdAt: '2026-11-02T00:00:00Z',
    updatedAt: '2026-11-02T00:00:00Z',
  },
  {
    id: 'st-5',
    bookId: 'store-202',
    type: 'expense',
    amountMinor: 5000000,
    transactionDate: '2026-11-02',
    category: 'Utilities',
    note: 'Electricity tokens',
    createdAt: '2026-11-02T00:00:00Z',
    updatedAt: '2026-11-02T00:00:00Z',
  },
];

const storeExport = generateExcelWorkbook(storeBook, storeTransactions);
assert(storeExport.filename.endsWith('.xlsx'), 'Filename must end with .xlsx');
const storeContentString = new TextDecoder('utf-8', { fatal: false }).decode(storeExport.content);

assert(storeContentString.includes('Daily Cash Flow'), 'Must contain Daily Cash Flow worksheet');
assert(storeContentString.includes('All Transactions'), 'Must contain All Transactions worksheet');

const requiredStoreCols = [
  'Date',
  'Daily Income',
  'Daily Expenses',
  'Daily Net Cash Flow',
  'Transactions Count'
];
for (const col of requiredStoreCols) {
  assert(storeContentString.includes(col), `Must include column: ${col}`);
}

// Verify daily totals preserved as usable numeric values
// Day 1: Income 500,000, Expense 100,000, Net 400,000
assert(storeContentString.includes('<v>500000</v>'), 'Day 1 Daily Income must be numeric 500000');
assert(storeContentString.includes('<v>100000</v>'), 'Day 1 Daily Expenses must be numeric 100000');
assert(storeContentString.includes('<v>400000</v>'), 'Day 1 Daily Net must be numeric 400000');

// Day 2: Income 450,000, Expense 50,000, Net 400,000
assert(storeContentString.includes('<v>450000</v>'), 'Day 2 Daily Income must be numeric 450000');
assert(storeContentString.includes('<v>50000</v>'), 'Day 2 Daily Expenses must be numeric 50000');

console.log('   ✅ Other Business Type Workbook validated successfully.');

// 3. Test Retail / Wholesale Business Type Export
console.log('\n3. Testing Retail / Wholesale Business Workbook Export...');
const retailBook = {
  id: 'retail-303',
  name: 'Mlimani Wholesale Mart',
  currencyCode: 'TZS',
  category: 'retail',
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
};

const inventoryItems = [
  {
    id: 'item-1',
    bookId: 'retail-303',
    name: 'Sugar 50kg Bag',
    currentQuantity: 40,
    avgPurchasePriceMinor: 10000000, // 100,000 TZS per bag
    status: 'in_stock',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'item-2',
    bookId: 'retail-303',
    name: 'Cooking Oil 20L',
    currentQuantity: 8,
    avgPurchasePriceMinor: 6000000, // 60,000 TZS per jerrycan
    status: 'low_stock',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'item-3',
    bookId: 'retail-303',
    name: 'Wheat Flour 25kg',
    currentQuantity: 0,
    avgPurchasePriceMinor: 4000000, // 40,000 TZS per bag
    status: 'empty',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
];

const retailTransactions = [
  {
    id: 'rt-1',
    bookId: 'retail-303',
    type: 'income',
    amountMinor: 120000000, // 1,200,000 TZS
    transactionDate: '2026-11-01',
    category: 'Retail Sale',
    note: 'Sold 10x Sugar 50kg Bag',
    itemId: 'item-1',
    itemName: 'Sugar 50kg Bag',
    quantitySold: 10,
    unitPriceMinor: 12000000,
    unitCostMinor: 10000000,
    cogsMinor: 100000000, // 1,000,000 TZS
    customerName: 'Juma Hassan',
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    amountPaidMinor: 120000000,
    outstandingBalanceMinor: 0,
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'rt-2',
    bookId: 'retail-303',
    type: 'income',
    amountMinor: 37500000, // 375,000 TZS
    transactionDate: '2026-11-01',
    category: 'Retail Sale',
    note: 'Sold 5x Cooking Oil 20L',
    itemId: 'item-2',
    itemName: 'Cooking Oil 20L',
    quantitySold: 5,
    unitPriceMinor: 7500000,
    unitCostMinor: 6000000,
    cogsMinor: 30000000, // 300,000 TZS
    customerName: 'Amina Said',
    paymentStatus: 'partial',
    paymentMethod: 'mobile',
    amountPaidMinor: 30000000, // 300,000 total paid (200k mobile + 100k bank)
    outstandingBalanceMinor: 7500000, // 75,000 remaining balance
    repayments: [
      {
        id: 'rep-1',
        amountMinor: 20000000,
        paymentMethod: 'mobile',
        repaymentDate: '2026-11-01',
        createdAt: '2026-11-01T00:00:00Z',
      },
      {
        id: 'rep-2',
        amountMinor: 10000000,
        paymentMethod: 'bank',
        repaymentDate: '2026-11-02',
        createdAt: '2026-11-02T00:00:00Z',
      },
    ],
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'rt-3',
    bookId: 'retail-303',
    type: 'expense',
    amountMinor: 5000000, // 50,000 TZS
    transactionDate: '2026-11-01',
    category: 'Shop Rent & Transport',
    note: 'Daily stall fee',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
];

const retailExport = generateExcelWorkbook(retailBook, retailTransactions, inventoryItems, '2026-11');
assert(retailExport.filename.endsWith('.xlsx'), 'Filename must end with .xlsx');
const retailContentString = new TextDecoder('utf-8', { fatal: false }).decode(retailExport.content);

// Verify all 4 required worksheets exist:
assert(retailContentString.includes('Inventory'), 'Must contain Inventory worksheet');
assert(retailContentString.includes('Sales'), 'Must contain Sales worksheet');
assert(retailContentString.includes('Debtors'), 'Must contain Debtors worksheet');
assert(retailContentString.includes('Daily Expenses'), 'Must contain Daily Expenses worksheet');

// 1. Check Inventory worksheet columns & values
const requiredInventoryCols = [
  'Item Name',
  'Available Stock Quantity',
  'Purchase Price per Unit (TSH)',
  'Stock Status'
];
for (const col of requiredInventoryCols) {
  assert(retailContentString.includes(col), `Must include column: ${col}`);
}
assert(retailContentString.includes('Sugar 50kg Bag'), 'Must include Sugar 50kg Bag');
assert(retailContentString.includes('Cooking Oil 20L'), 'Must include Cooking Oil 20L');
assert(retailContentString.includes('Wheat Flour 25kg'), 'Must include Wheat Flour 25kg');
assert(retailContentString.includes('In stock'), 'Must include In stock status');
assert(retailContentString.includes('Running low'), 'Must include Running low status');
assert(retailContentString.includes('Empty'), 'Must include Empty status');

// 2. Check Sales worksheet columns & values
const requiredSalesCols = [
  'Sale Date',
  'Customer Name',
  'Item Sold',
  'Quantity',
  'Selling Price per Unit (TSH)',
  'Total Sale Amount (TSH)',
  'Amount Paid (TSH)',
  'Outstanding Balance (TSH)',
  'Payment Method',
  'Payment Status'
];
for (const col of requiredSalesCols) {
  assert(retailContentString.includes(col), `Must include column: ${col}`);
}
assert(retailContentString.includes('Juma Hassan'), 'Must include customer Juma Hassan');
assert(retailContentString.includes('Amina Said'), 'Must include customer Amina Said');
assert(retailContentString.includes('<v>1200000</v>'), 'Total Sale Amount must be numeric 1200000');
assert(retailContentString.includes('<v>375000</v>'), 'Total Sale Amount must be numeric 375000');

// Verify Sales worksheet payment method summary
assert(retailContentString.includes('PAYMENT SUMMARY'), 'Must include PAYMENT SUMMARY section');
assert(retailContentString.includes('Cash'), 'Must include Cash payment channel');
assert(retailContentString.includes('Mobile/Phone'), 'Must include Mobile/Phone payment channel');
assert(retailContentString.includes('Bank'), 'Must include Bank payment channel');
assert(retailContentString.includes('<v>200000</v>'), 'Mobile received amount must be numeric 200000');
assert(retailContentString.includes('<v>100000</v>'), 'Bank received amount must be numeric 100000');
assert(retailContentString.includes('<v>1500000</v>'), 'Total received amount must be numeric 1500000');

// 3. Check Debtors worksheet columns & values (only sales with outstanding balance)
const requiredDebtorCols = [
  'Customer Name',
  'Item Purchased',
  'Quantity',
  'Amount Paid (TSH)',
  'Amount Due (TSH)'
];
for (const col of requiredDebtorCols) {
  assert(retailContentString.includes(col), `Must include column: ${col}`);
}
// Amina Said has 75,000 balance remaining -> should be in Debtors
assert(retailContentString.includes('<v>75000</v>'), 'Amount Due must be numeric 75000');
// Juma Hassan is paid in full -> his name should not appear as a debtor in the Debtors sheet rows

// 4. Check Daily Expenses worksheet columns & values
const requiredExpenseCols = [
  'Expense Date',
  'Expense Name / Description',
  'Amount (TSH)'
];
for (const col of requiredExpenseCols) {
  assert(retailContentString.includes(col), `Must include column: ${col}`);
}
assert(retailContentString.includes('Shop Rent &amp; Transport - Daily stall fee'), 'Must include expense description');
assert(retailContentString.includes('<v>50000</v>'), 'Expense Amount must be numeric 50000');

console.log('   ✅ Retail / Wholesale Business Workbook validated successfully.');

console.log('\n🎉 ALL EXCEL WORKBOOK EXPORT TESTS PASSED!\n');
