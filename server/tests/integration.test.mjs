import { runMigrations } from '../src/infrastructure/db/migrations.js';
import { getDb, closeDb } from '../src/infrastructure/db/connection.js';
import { BookService } from '../src/application/services/book-service.js';
import { TransactionService } from '../src/application/services/transaction-service.js';
import { SummaryService } from '../src/application/services/summary-service.js';
import { BackupService } from '../src/infrastructure/backup/backup-service.js';
import { serializeTransactionsToCsv } from '../src/infrastructure/backup/csv-serializer.js';
import { ValidationError } from '../src/domain/errors.js';
import { CreateTransactionSchema } from '../src/application/validation/schemas.js';

console.log('🧪 Starting POTFOLIOO Backend & Database Integration Tests...\n');

try {
  // 1. Run migrations
  console.log('1. Testing DB Migrations...');
  runMigrations();
  console.log('   ✅ Migrations executed successfully.');

  // 2. Test Book Service (General & Rental)
  console.log('2. Testing Book creation & categories...');
  const bookService = new BookService();
  const testBook = bookService.createBook({
    name: 'Test Business Book',
    currencyCode: 'TZS',
    category: 'other',
  });
  console.log('   Created General Book:', testBook.id, testBook.name, testBook.category);

  const rentalBook = bookService.createBook({
    name: 'Kariakoo Apartments',
    currencyCode: 'TZS',
    category: 'rental',
  });
  console.log('   Created Rental Book:', rentalBook.id, rentalBook.name, rentalBook.category);

  if (rentalBook.category !== 'rental') {
    throw new Error('Rental book category mismatch');
  }
  console.log('   ✅ Multi-business books created and verified.');

  // 3. Test Transactions & Rental Fields
  console.log('3. Testing Transactions & Rental Format...');
  const txService = new TransactionService();
  const rentPayment = txService.createTransaction({
    bookId: rentalBook.id,
    type: 'income',
    amountMinor: 60000000, // 600,000 TZS
    transactionDate: '2026-11-01',
    category: 'Rent Payment',
    tenantName: 'Baraka Ali',
    roomNumber: 'Room 3A',
    phoneNumber: '0712345678',
    chargePerRoom: 20000000, // 200,000 TZS per month
    monthsPaid: 3.0,
    dueDate: '2027-02-01',
    note: 'Paid via M-Pesa',
  });

  const propertyExpense = txService.createTransaction({
    bookId: rentalBook.id,
    type: 'expense',
    amountMinor: 15000000, // 150,000 TZS
    transactionDate: '2026-11-05',
    category: 'Renovations',
    note: 'Repainting corridor & wall crack repair',
  });

  console.log('   Rental Income:', rentPayment.tenantName, rentPayment.roomNumber, rentPayment.monthsPaid, 'months, due:', rentPayment.dueDate);
  console.log('   Property Expense:', propertyExpense.category, propertyExpense.amountMinor);
  console.log('   ✅ Rental transactions persisted successfully.');

  // 4. Test Validation & Invariant Protection
  console.log('4. Testing Invariant & Validation Enforcement...');
  let validationPassed = false;
  try {
    // Attempt negative minor unit
    CreateTransactionSchema.parse({
      bookId: testBook.id,
      type: 'income',
      amountMinor: -500,
      transactionDate: '2026-11-01',
    });
  } catch (e) {
    validationPassed = true;
    console.log('   ✅ Rejected negative amountMinor as expected.');
  }

  try {
    // Attempt invalid date format
    CreateTransactionSchema.parse({
      bookId: testBook.id,
      type: 'expense',
      amountMinor: 500,
      transactionDate: '02-11-2026', // wrong format
    });
  } catch (e) {
    console.log('   ✅ Rejected non-YYYY-MM-DD date as expected.');
  }

  // 5. Test Monthly Summary
  console.log('5. Testing Monthly Cash Flow Summary for Rental...');
  const summaryService = new SummaryService();
  const summary = summaryService.getMonthlySummary(rentalBook.id, '2026-11');
  console.log('   Summary:', {
    income: `TSh ${(summary.totalIncomeMinor / 100).toLocaleString()}`,
    expense: `TSh ${(summary.totalExpenseMinor / 100).toLocaleString()}`,
    netProfit: `TSh ${(summary.netProfitMinor / 100).toLocaleString()}`,
    count: summary.transactionCount,
  });

  if (summary.totalIncomeMinor !== 60000000 || summary.totalExpenseMinor !== 15000000 || summary.netProfitMinor !== 45000000) {
    throw new Error('Summary calculation error');
  }
  console.log('   ✅ Rental cash flow exact arithmetic verified.');

  // Cleanup test books
  bookService.deleteBook(testBook.id);
  bookService.deleteBook(rentalBook.id);
  console.log('   Cleaned up test data.');

  closeDb();
  console.log('\n🎉 ALL BACKEND & DATABASE TESTS PASSED SUCCESSFULLY!');
} catch (err) {
  console.error('\n❌ Test failure:', err);
  closeDb();
  process.exit(1);
}
