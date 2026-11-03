import assert from 'node:assert';
import {
  computeStockStatus,
  calculateWeightedAverageCost,
  calculateRetailTodaySummary,
  calculateRetailPeriodStatement,
  calculateItemProfitability,
  getBestSellingItems,
  getInventoryAlerts,
} from '../../src/domain/models/inventory.ts';

console.log('🧪 Starting Inventory & Retail Domain Unit Tests...\n');

// 1. Stock Status Thresholds
console.log('1. Testing Stock Status Thresholds...');
assert.strictEqual(computeStockStatus(100), 'in_stock', '>10 must be in_stock');
assert.strictEqual(computeStockStatus(11), 'in_stock', '11 must be in_stock');
assert.strictEqual(computeStockStatus(10), 'low_stock', '10 must be low_stock');
assert.strictEqual(computeStockStatus(5), 'low_stock', '5 must be low_stock');
assert.strictEqual(computeStockStatus(1), 'low_stock', '1 must be low_stock');
assert.strictEqual(computeStockStatus(0), 'empty', '0 must be empty');
assert.strictEqual(computeStockStatus(-1), 'empty', 'negative must be empty');
console.log('   ✅ Stock status thresholds verified.');

// 2. Weighted Average Purchase Cost Recalculation
console.log('\n2. Testing Weighted Average Purchase Cost Formula...');
// Current: 10 units @ 1,000 TZS (100000 minor)
// Added: 10 units @ 2,000 TZS (200000 minor)
// Expected: (10*100,000 + 10*200,000) / 20 = 150,000 minor (1,500 TZS)
const avg1 = calculateWeightedAverageCost(10, 100000, 10, 200000);
assert.strictEqual(avg1, 150000, 'Average cost of equal quantities must be midpoint');

// Current: 20 units @ 150,000 minor
// Added: 5 units @ 100,000 minor
// Total cost: 20*150,000 + 5*100,000 = 3,000,000 + 500,000 = 3,500,000. Total Q: 25.
// Expected: 3,500,000 / 25 = 140,000 minor
const avg2 = calculateWeightedAverageCost(20, avg1, 5, 100000);
assert.strictEqual(avg2, 140000, 'Weighted average cost must account for different batch sizes');

// Starting from empty stock
const avgEmpty = calculateWeightedAverageCost(0, 0, 15, 250000);
assert.strictEqual(avgEmpty, 250000, 'When initial stock is 0, new price is the unit cost');
console.log('   ✅ Weighted average calculations verified.');

// 3. Alerts Generation & Thresholds
console.log('\n3. Testing Inventory Alerts & Deduplication...');
const testItems = [
  { id: 'i1', bookId: 'b1', name: 'Flour', currentQuantity: 25, avgPurchasePriceMinor: 50000, status: 'in_stock', createdAt: '', updatedAt: '' },
  { id: 'i2', bookId: 'b1', name: 'Sugar', currentQuantity: 7, avgPurchasePriceMinor: 80000, status: 'low_stock', createdAt: '', updatedAt: '' },
  { id: 'i3', bookId: 'b1', name: 'Salt', currentQuantity: 0, avgPurchasePriceMinor: 20000, status: 'empty', createdAt: '', updatedAt: '' },
];

const alerts = getInventoryAlerts(testItems);
assert.strictEqual(alerts.length, 2, 'Should only alert for low_stock and empty items');
assert.strictEqual(alerts[0].status, 'empty', 'Empty items should be prioritized in alerts');
assert.strictEqual(alerts[0].itemName, 'Salt');
assert.strictEqual(alerts[1].status, 'low_stock');
assert.strictEqual(alerts[1].itemName, 'Sugar');
assert.strictEqual(alerts[1].currentQuantity, 7);
console.log('   ✅ Inventory alerts generation verified.');

// 4. Retail Period Statement: Sales, COGS, Gross Profit, Operating Expenses, Net Profit
console.log('\n4. Testing Retail Financial Statement...');
const sampleTxns = [
  // Sale: 2 units of Sugar @ 120,000 TZS = 240,000 TZS. COGS = 2 * 80,000 = 160,000 TZS
  {
    id: 's1',
    bookId: 'b1',
    type: 'income',
    amountMinor: 24000000,
    transactionDate: '2026-11-03',
    itemId: 'i2',
    itemName: 'Sugar',
    quantitySold: 2,
    unitPriceMinor: 12000000,
    unitCostMinor: 8000000,
    cogsMinor: 16000000,
    createdAt: '',
    updatedAt: '',
  },
  // Operating expense: Shop electricity
  {
    id: 'e1',
    bookId: 'b1',
    type: 'expense',
    amountMinor: 3000000, // 30,000 TZS
    transactionDate: '2026-11-03',
    category: 'Electricity & Utilities',
    createdAt: '',
    updatedAt: '',
  },
];

const statement = calculateRetailPeriodStatement(sampleTxns);
assert.strictEqual(statement.salesRevenueMinor, 24000000, 'Sales revenue must match');
assert.strictEqual(statement.cogsMinor, 16000000, 'COGS must match');
assert.strictEqual(statement.grossProfitMinor, 8000000, 'Gross profit must be Sales - COGS (80,000 TZS)');
assert.strictEqual(statement.operatingExpensesMinor, 3000000, 'Operating expenses must match (30,000 TZS)');
assert.strictEqual(statement.netProfitMinor, 5000000, 'Net profit must be Gross Profit - Expenses (50,000 TZS)');
console.log('   ✅ Retail income statement arithmetic verified.');

// 5. Best-Selling Items Summary
console.log('\n5. Testing Best-Selling Items Ranking...');
const bestSellers = getBestSellingItems(testItems, sampleTxns);
assert.strictEqual(bestSellers.length, 1, 'Only items with sales should appear in best sellers');
assert.strictEqual(bestSellers[0].rank, 1);
assert.strictEqual(bestSellers[0].itemName, 'Sugar');
assert.strictEqual(bestSellers[0].quantitySold, 2);
assert.strictEqual(bestSellers[0].salesRevenueMinor, 24000000);
assert.strictEqual(bestSellers[0].grossProfitMinor, 8000000);
console.log('   ✅ Best-selling items ranking verified.');

console.log('\n🎉 ALL INVENTORY DOMAIN UNIT TESTS PASSED SUCCESSFULLY!\n');
