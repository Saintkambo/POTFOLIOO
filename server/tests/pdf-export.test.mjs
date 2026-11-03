import assert from 'node:assert';
import { generateRetailPdfReport } from '../../src/infrastructure/export/pdf-export-service.ts';

console.log('🧪 Starting Retail Business PDF Export (.pdf) Tests...\n');

const testBook = {
  id: 'retail-pdf-1',
  name: 'Mlimani Wholesale Supermarket',
  currencyCode: 'TZS',
  category: 'retail',
  createdAt: '2026-11-01T00:00:00Z',
  updatedAt: '2026-11-01T00:00:00Z',
};

const testInventory = [
  {
    id: 'item-1',
    bookId: 'retail-pdf-1',
    name: 'Sugar 50kg Bag',
    currentQuantity: 35,
    avgPurchasePriceMinor: 10000000, // 100,000 TZS
    status: 'in_stock',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
  {
    id: 'item-2',
    bookId: 'retail-pdf-1',
    name: 'Cooking Oil 20L',
    currentQuantity: 4,
    avgPurchasePriceMinor: 6500000, // 65,000 TZS
    status: 'low_stock',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
];

const testTransactions = [
  // Sale 1: Paid in full via Cash (1,200,000 TZS)
  {
    id: 'tx-1',
    bookId: 'retail-pdf-1',
    type: 'income',
    amountMinor: 120000000,
    transactionDate: '2026-11-01',
    category: 'Retail Sale',
    note: 'Sold 10x Sugar 50kg Bag',
    itemId: 'item-1',
    itemName: 'Sugar 50kg Bag',
    quantitySold: 10,
    unitPriceMinor: 12000000,
    unitCostMinor: 10000000,
    cogsMinor: 100000000,
    customerName: 'Juma Hassan',
    paymentStatus: 'paid',
    paymentMethod: 'cash',
    amountPaidMinor: 120000000,
    outstandingBalanceMinor: 0,
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
  // Sale 2: Partial sale (375,000 TZS total). Paid 200,000 via mobile, then later repaid 100,000 via bank.
  // Remaining balance = 75,000 TZS
  {
    id: 'tx-2',
    bookId: 'retail-pdf-1',
    type: 'income',
    amountMinor: 37500000,
    transactionDate: '2026-11-01',
    category: 'Retail Sale',
    note: 'Sold 5x Cooking Oil 20L',
    itemId: 'item-2',
    itemName: 'Cooking Oil 20L',
    quantitySold: 5,
    unitPriceMinor: 7500000,
    unitCostMinor: 6500000,
    cogsMinor: 32500000,
    customerName: 'Amina Said',
    paymentStatus: 'partial',
    paymentMethod: 'mobile',
    amountPaidMinor: 30000000,
    outstandingBalanceMinor: 7500000,
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
  // Expense 1: Operating Expense (50,000 TZS)
  {
    id: 'tx-3',
    bookId: 'retail-pdf-1',
    type: 'expense',
    amountMinor: 5000000,
    transactionDate: '2026-11-01',
    category: 'Shop Rent & Transport',
    note: 'Daily stall license fee',
    createdAt: '2026-11-01T00:00:00Z',
    updatedAt: '2026-11-01T00:00:00Z',
  },
];

console.log('1. Testing PDF Generation...');
const pdfResult = generateRetailPdfReport(testBook, testTransactions, testInventory, '2026-11');

assert(pdfResult.filename.endsWith('.pdf'), 'Filename must end with .pdf');
assert(pdfResult.content.length > 500, 'PDF content must be non-empty binary buffer');

// Check PDF 1.4 header and trailer
const pdfString = new TextDecoder('utf-8', { fatal: false }).decode(pdfResult.content);
assert(pdfString.startsWith('%PDF-1.4'), 'Must start with %PDF-1.4 standard header');
assert(pdfString.includes('%%EOF'), 'Must end with %%EOF standard trailer');

console.log('   ✅ Valid PDF 1.4 structure verified.');

console.log('\n2. Verifying Required Printable Sections...');
// 1. Business & Header
assert(pdfString.includes('MLIMANI WHOLESALE SUPERMARKET'), 'Must contain business title');
assert(pdfString.includes('RETAIL / WHOLESALE BUSINESS REPORT'), 'Must contain report title');

// 2. Inventory section
assert(pdfString.includes('1. CURRENT INVENTORY STATUS'), 'Must contain Inventory section');
assert(pdfString.includes('Sugar 50kg Bag'), 'Must include inventory items');
assert(pdfString.includes('In stock'), 'Must include inventory status');

// 3. Sales & Payment summary
assert(pdfString.includes('2. SALES TRANSACTIONS & PAYMENT METHOD SUMMARY'), 'Must contain Sales section');
assert(pdfString.includes('CASH RECEIVED'), 'Must contain Cash received summary');
assert(pdfString.includes('MOBILE / PHONE'), 'Must contain Mobile received summary');
assert(pdfString.includes('BANK TRANSFERS'), 'Must contain Bank transfers summary');
assert(pdfString.includes('TOTAL RECEIVED'), 'Must contain Total received summary');
assert(pdfString.includes('TSh 1,200,000'), 'Cash total must be 1,200,000 TSh');
assert(pdfString.includes('TSh 200,000'), 'Mobile total must be 200,000 TSh');
assert(pdfString.includes('TSh 100,000'), 'Bank total must be 100,000 TSh');
assert(pdfString.includes('TSh 1,500,000'), 'Total received must be 1,500,000 TSh');

// 4. Debtors section
assert(pdfString.includes('3. CUSTOMER DEBTORS & RECEIVABLES'), 'Must contain Debtors section');
assert(pdfString.includes('Amina Said'), 'Amina Said must be listed as a debtor');
assert(pdfString.includes('TSh 75,000'), 'Amina Said balance must be 75,000 TSh');

// 5. Daily Expenses section
assert(pdfString.includes('4. DAILY OPERATING EXPENSES'), 'Must contain Daily Expenses section');
assert(pdfString.includes('Shop Rent & Transport - Daily stall license fee'), 'Must contain expense note');
assert(pdfString.includes('TSh 50,000'), 'Expense total must be 50,000 TSh');

console.log('   ✅ All 4 printable sections, payment totals, and fields verified.');
console.log('\n🎉 ALL PDF EXPORT TESTS PASSED!\n');
